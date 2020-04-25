import React, { Component } from "react";
import {
  Select,
  Table,
  Input,
  Button,
  Form,
  message,
  Radio,
  Modal,
  Checkbox
} from "antd";
import {
  EditOutlined,
  CheckOutlined,
  ExclamationCircleOutlined
} from "@ant-design/icons";
import webService from "../webService";
import extService from "../extService";
import { operateType } from "./constants";
import { objectToMap } from "antd-generator-core/utils";
import "./App.css";

const caseType = {
  UPPER: 1,
  LOWER: 2
};
function setFirstCase(str, type) {
  const reg = /^(\w)/g;
  return type === caseType.LOWER
    ? str.replace(reg, $0 => $0.toLowerCase())
    : str.replace(reg, $0 => $0.toUpperCase());
}
class App extends Component {
  constructor(props) {
    super(props);
    this.formRef = React.createRef();
    this.modalFormRef = React.createRef();
    this.errorRef = React.createRef();
    try {
      if (window.context === "web") {
        this.service = webService;
      } else {
        this.service = extService;
      }
    } catch (e) {
      this.service = webService;
    }
    console.log(operateType, objectToMap);
  }
  state = {
    selectedRowKeys: [], // Check here to configure the default column
    loading: false,
    data: { tags: [], definitions: [] },
    type: "url",
    value: "",
    folders: [],
    path: "",
    modalVisible: false,
    editting: "",
    interval: undefined,
    loaded: false
  };

  showModal(api) {
    console.log(api);
    this.setState({ modalVisible: true, editting: api });
    this.setModalFormValues(this, api);
  }
  setModalFormValues(ref, api) {
    const { interval } = ref.state;
    const { operate, reducer, successText } = api;
    if (!ref.modalFormRef.current) {
      if (interval === undefined) {
        const interval = window.setInterval(
          ref.setModalFormValues,
          500,
          ref,
          api
        );
        ref.setState({ interval });
      }
    } else {
      ref.modalFormRef.current.setFieldsValue({
        operate,
        reducer,
        successText
      });
      if (interval) {
        clearInterval(interval);
        ref.setState({ interval: undefined });
      }
    }
  }

  setApiOperate = (api, type) => {
    if (type === operateType.PUT_REDUCER) {
      api.operate = operateType.PUT_REDUCER;

      if (api.responseBodyTitle === "") {
        api.effectName = "do" + setFirstCase(api.name, caseType.UPPER);
        api.state = setFirstCase(api.name, caseType.LOWER) + "Result";
      } else {
        api.effectName =
          "fetch" + setFirstCase(api.responseBodyTitle, caseType.UPPER);
        api.state = setFirstCase(api.responseBodyTitle, caseType.LOWER);
      }
      api.reducer = "set" + setFirstCase(api.state, caseType.UPPER);
    } else {
      api.successText = "操作成功！";
      api.operate = operateType.SHOW_SUCCESS;
      api.reducer = undefined;
      api.state = undefined;
      if (api.requestBodyTitle !== "") {
        api.effectName =
          api.method + setFirstCase(api.requestBodyTitle, caseType.UPPER);
      } else {
        api.effectName = "do" + setFirstCase(api.name, caseType.UPPER);
      }
    }
  };

  loadAppInfo = () => {
    const { type, value } = this.state;
    let onSuccess = data => {
      let selectkeys = [];
      const initialValues = {};
      for (let tag of data.tags.values()) {
        initialValues[tag.name] = tag.name;
        for (let api of tag.apis) {
          this.setApiOperate(
            api,
            api.method === "get"
              ? operateType.PUT_REDUCER
              : operateType.SHOW_SUCCESS
          );
          api.key = `${api.tag}_${api.method}_${api.path}`;
          selectkeys.push(api.key);
        }
      }
      this.formRef.current.setFieldsValue(initialValues);
      this.setState({
        data: data,
        selectedRowKeys: selectkeys,
        initialValues,
        loaded: true
      });
    };
    let onError = error =>
      message.error(`load api info fail,error:${error.message}`);
    this.service.getApiData(type, value, onSuccess, onError);
  };

  generate = () => {
    if (!this.validateAPis()) {
      return;
    }
    const { selectedRowKeys, data, path } = this.state;
    let selectKeySet = new Set(selectedRowKeys);
    let tags = [];
    for (let tag of data.tags.values()) {
      const apis = tag.apis.filter(api => selectKeySet.has(api.key));
      if (apis.length > 0) {
        tags.push({
          name: tag.name,
          namespace: tag.namespace,
          description: tag.description,
          apis
        });
      }
    }
    console.log(tags);
    this.service.generate(
      tags,
      data.definitions,
      path,
      data => message.success("genterate success"),
      error => message.error(`generate fail,error:${error.message}`)
    );
  };
  validateAPis = () => {
    const { selectedRowKeys, data } = this.state;
    let selectKeySet = new Set(selectedRowKeys);
    for (let tag of data.tags.values()) {
      const apis = tag.apis.filter(api => selectKeySet.has(api.key));
      for (let api of apis.values()) {
        if (api.stateEditting && api.state === "" && api.effect) {
          api.stateError = true;
          this.setState({ data: { ...data } });
          message.error("state name is required!", 2, () =>
            this.errorRef.current.focus()
          );
          return false;
        }
        if (api.effectEditting && api.effectName === "" && api.effect) {
          api.effectError = true;
          this.setState({ data: { ...data } });
          message.error("effect name is required!", 2, () =>
            this.errorRef.current.focus()
          );
          return false;
        }
      }
    }
    return true;
  };
  onClickGenerate = () => {
    this.formRef.current
      .validateFields()
      .then(values => {
        const map = objectToMap(values);
        const { data } = this.state;
        for (let tag of data.tags.values()) {
          if (map.has(tag.name)) {
            tag.namespace = map.get(tag.name);
          }
        }
        this.generate();
      })
      .catch(errorInfo => console.log(errorInfo));
  };
  onSelectChange = selectedRowKeys => {
    this.setState({ selectedRowKeys });
  };
  onRadioChange = e => {
    this.setState({ type: e.target.value });
  };

  onUrlChange = e => {
    this.setState({ value: e.target.value });
  };
  onFileChange = e => {
    this.setState({ value: e.target.value });
  };
  onFolderChange = value => {
    this.setState({ path: value });
  };
  onFinish = values => {
    if (this.state.loaded) {
      Modal.confirm({
        title: "Do you want to reload the api doc?",
        icon: <ExclamationCircleOutlined />,
        content:
          "When Yes,you will lose the generator configuration and reload the api doc,continue?",
        okText: "Yes",
        onOk: () => {
          this.loadAppInfo();
        }
      });
    } else {
      this.loadAppInfo();
    }
  };

  hideModal = () => this.setState({ modalVisible: false });
  onOk = () => {
    this.modalFormRef.current.submit();
  };
  ohModalFinish = values => {
    const { editting } = this.state;
    editting.operate = values.operate;
    editting.reducer = values.reducer;
    editting.successText = values.successText;
    this.hideModal();
  };

  componentDidMount() {
    this.service.getFolders(
      data => {
        this.setState({ folders: data });
      },
      error =>
        message.error(`get workspace folders fail,error:${error.message}`)
    );
  }

  columns = [
    {
      title: "Name",
      dataIndex: "name",
      width: 160
    },
    {
      title: "RequestMapping",
      dataIndex: "method",
      width: 200,
      render: (val, record) => `${val}:  ${record.path}`
    },
    {
      title: "Summary",
      dataIndex: "summary",
      width: 200
    },
    {
      title: "Effect",
      colSpan: 2,
      dataIndex: "effect",
      width: 20,
      render: (val, record) => {
        return (
          <Checkbox
            onChange={e => {
              record.effect = e.target.checked;
              this.setState({ data: { ...this.state.data } });
            }}
            checked={val}
          ></Checkbox>
        );
      }
    },
    {
      title: "EffectName",
      colSpan: 0,
      dataIndex: "effectName",
      width: 160,
      render: (val, record) => {
        if (record.effect === false) {
          return "";
        }
        const accept = value => {
          if (value === "") {
            message.error("effectName is required!");
            return;
          }
          record.effectEditting = false;
          record.effectName = value;
          record.effectError = undefined;
          this.setState({ data: { ...this.state.data } });
        };
        if (record.effectEditting) {
          const errorRef = record.effectError ? { ref: this.errorRef } : {};
          return (
            <>
              <Input
                {...errorRef}
                style={{ width: "90%" }}
                value={val}
                onBlur={e => {
                  accept(e.target.value);
                }}
                onChange={e => {
                  record.effectName = e.target.value;
                  this.setState({ data: { ...this.state.data } });
                }}
              />
              <CheckOutlined
                onClick={() => accept(val)}
                style={{ marginLeft: 8 }}
              />
            </>
          );
        } else {
          return (
            <div
              style={{ cursor: "pointer" }}
              title="edit"
              onClick={() => {
                record.effectEditting = true;
                this.setState({ data: { ...this.state.data } });
              }}
            >
              {val}
              <EditOutlined style={{ marginLeft: 8 }} />
            </div>
          );
        }
      }
    },
    {
      title: "Operate",
      dataIndex: "operate",
      width: 240,
      render: (val, record) => {
        if (record.effect === false) {
          return "";
        }
        let text = "";
        switch (val) {
          case operateType.PUT_REDUCER:
            text = "Put " + record.reducer;
            break;
          case operateType.SHOW_SUCCESS:
            text = "show success message";
            break;
          default:
            text = "no action";
        }
        return (
          <div
            style={{ cursor: "pointer" }}
            title="edit"
            onClick={() => this.showModal(record)}
          >
            {text}
            <EditOutlined style={{ marginLeft: 8 }} />
          </div>
        );
      }
    },
    {
      title: "State",
      dataIndex: "state",
      render: (val, record) => {
        if (record.effect === false) {
          return "";
        }
        if (record.operate !== operateType.PUT_REDUCER) {
          return "";
        }
        const accept = value => {
          if (value === "") {
            message.error("state is required!");
            return;
          }
          record.stateEditting = false;
          record.state = value;
          record.stateError = undefined;
          this.setState({ data: { ...this.state.data } });
        };
        if (record.stateEditting) {
          const errorRef = record.stateError ? { ref: this.errorRef } : {};
          return (
            <>
              <Input
                {...errorRef}
                style={{ width: "90%" }}
                value={val}
                onBlur={e => {
                  accept(e.target.value);
                }}
                onChange={e => {
                  record.state = e.target.value;
                  this.setState({ data: { ...this.state.data } });
                }}
              />
              <CheckOutlined
                onClick={() => accept(val)}
                style={{ marginLeft: 8 }}
              />
            </>
          );
        } else {
          return (
            <div
              style={{ cursor: "pointer" }}
              title="edit"
              onClick={() => {
                record.stateEditting = true;
                this.setState({ data: { ...this.state.data } });
              }}
            >
              {val}
              <EditOutlined style={{ marginLeft: 8 }} />
            </div>
          );
        }
      }
    }
  ];

  formItemLayout = {
    labelCol: { span: 1 },
    wrapperCol: { span: 8 }
  };

  formRadioLayout = {
    wrapperCol: { span: 8, offset: 1 }
  };
  formTailLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 8, offset: 2 }
  };

  modalFormItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 20 }
  };
  render() {
    const {
      data,
      folders,
      type,
      loading,
      selectedRowKeys,
      modalVisible,
      editting,
      loaded
    } = this.state;
    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectChange
    };

    const tables = data.tags.map(tag => {
      return (
        <div key={tag.name}>
          <h2>{tag.name} Api</h2>
          <div>
            <div style={{ display: "inline-block", width: 535 }}>
              {tag.description}
            </div>
            <div style={{ display: "inline-block", width: 400 }}>
              <Form.Item
                name={tag.name}
                label="NameSpace"
                rules={[
                  {
                    required: true,
                    message: "model namespace is required"
                  }
                ]}
              >
                <Input placeholder={`model namespace for tag ${tag.name}`} />
              </Form.Item>
            </div>
          </div>
          <Table
            loading={loading}
            rowKey="key"
            pagination={false}
            size="small"
            bordered={true}
            rowSelection={rowSelection}
            columns={this.columns}
            dataSource={tag.apis}
          />
        </div>
      );
    });
    let options = folders.map(f => (
      <Select.Option key={f} value={f}>
        {f}
      </Select.Option>
    ));
    return (
      <div>
        <div
          style={{
            marginBottom: 16,
            marginTop: 16,
            marginLeft: 5,
            marginRight: 5
          }}
        >
          <Form
            onFinish={this.onFinish.bind(this)}
            ref={this.formRef}
            hideRequiredMark
          >
            <Form.Item {...this.formRadioLayout}>
              <Radio.Group value={type} onChange={this.onRadioChange}>
                <Radio.Button value="url">Url</Radio.Button>
                <Radio.Button value="file">Json File</Radio.Button>
              </Radio.Group>
            </Form.Item>
            {type === "url" && (
              <Form.Item
                name="url"
                label="Url"
                {...this.formItemLayout}
                rules={[
                  {
                    type: "url",
                    message: "The input is not valid url!"
                  },
                  {
                    required: true,
                    message: "Please input  url!"
                  }
                ]}
              >
                <Input
                  placeholder="swagger v2 or openapi v3  doc url"
                  onChange={this.onUrlChange}
                />
              </Form.Item>
            )}
            {type === "file" && (
              <Form.Item
                name="file"
                label="File"
                {...this.formItemLayout}
                rules={[
                  {
                    required: true,
                    message: "Please input json file path!"
                  }
                ]}
              >
                <Input
                  placeholder="swagger v2  openapi v3 json file path"
                  onChange={this.onFileChange}
                />
              </Form.Item>
            )}
            <Form.Item
              name="folder"
              label="Folder"
              {...this.formItemLayout}
              rules={[
                {
                  required: true,
                  message: "Please select the workspace folder!"
                }
              ]}
            >
              <Select
                onChange={this.onFolderChange}
                placeholder="workspace folder"
              >
                {options}
              </Select>
            </Form.Item>

            <Form.Item {...this.formTailLayout}>
              <Button type="primary" htmlType="submit">
                Load
              </Button>
              {loaded && (
                <Button
                  type="primary"
                  onClick={this.onClickGenerate.bind(this)}
                  style={{ marginLeft: 16 }}
                >
                  Generate
                </Button>
              )}
            </Form.Item>
            {tables}
          </Form>
          <Modal
            title={`effect ${editting.effectName} action`}
            visible={modalVisible}
            onOk={this.onOk}
            onCancel={this.hideModal}
            width={480}
          >
            <Form
              onFinish={this.ohModalFinish.bind(this)}
              ref={this.modalFormRef}
              hideRequiredMark
            >
              <Form.Item
                label={`operate`}
                name="operate"
                {...this.modalFormItemLayout}
              >
                <Select
                  placeholder="select operate type"
                  style={{ width: "100%" }}
                  rules={[
                    {
                      required: true,
                      message: "operate type is required!"
                    }
                  ]}
                >
                  <Select.Option value={operateType.NONE}>
                    no action
                  </Select.Option>
                  <Select.Option value={operateType.PUT_REDUCER}>
                    put reducer
                  </Select.Option>
                  <Select.Option value={operateType.SHOW_SUCCESS}>
                    show success message
                  </Select.Option>
                </Select>
              </Form.Item>
              {this.modalFormRef.current &&
                this.modalFormRef.current.getFieldValue("operate") ===
                  operateType.PUT_REDUCER && (
                  <Form.Item
                    {...this.modalFormItemLayout}
                    name="reducer"
                    label="Reducer"
                    rules={[
                      {
                        required: true,
                        message: "reducer name is required!"
                      }
                    ]}
                  >
                    <Input placeholder="reducer name" />
                  </Form.Item>
                )}
              {this.modalFormRef.current &&
                this.modalFormRef.current.getFieldValue("operate") ===
                  operateType.SHOW_SUCCESS && (
                  <Form.Item
                    {...this.modalFormItemLayout}
                    name="successText"
                    label="Text"
                    rules={[
                      {
                        required: true,
                        message: "text is required!"
                      }
                    ]}
                  >
                    <Input placeholder="success message" />
                  </Form.Item>
                )}
            </Form>
          </Modal>
        </div>
      </div>
    );
  }
}

export default App;

# Ant Design Pro Code Generator

从 Swagger 2.x 和 [OpenApi规范3.x](https://swagger.io/specification/) 的json描述文档生成 [Ant Design Pro](https://pro.ant.design/index-cn) 项目中的service,mock,model代码。当前支持生成es6代码，暂时不支持生成typescipt代码。

## 截图

![](E:\code\vscode\antd-pro-generator\screen_shot.png)

## 使用说明

1. View--->Command Platte..., 查找 Ant Design Pro Code Generator 项运行
2. 选择从Url或者从本地文件加载接口文档，输入Url或者文件路径，然后load。显示文档信息，按tag分组，每个tag对应一个service/mock/model的js文件，文件名为tag名称。
3.  根据自己的情况修改model的namespace、各个api 对应的effect名称、effect对应的操作及state，完成之后generate
4.   生成完成，mock目录、src/services目录、src/models目录会生成相应的文件。文件重名时会以xxx.1.js,xxx.2.js等方式生成新的文件，不覆盖已有文件。如果重新生成注意合并文件或者修改文件名。一般情况下，生成的service不需要修改就可以直接使用。mock和model代码要适当修改。



 
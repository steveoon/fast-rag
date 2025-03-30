// 预定义的深色主题 CSS
export const darkThemeCSS = `
/* 常规样式优化 */
.swagger-ui *,
.swagger-ui *:before,
.swagger-ui *:after {
  box-sizing: border-box;
}

/* 增强文字可见度 */
.swagger-ui .opblock-summary-operation-id, 
.swagger-ui .opblock-summary-path,
.swagger-ui .opblock-summary-path__deprecated,
.swagger-ui .opblock-summary-description,
.swagger-ui .opblock-description-wrapper p,
.swagger-ui .responses-inner h4,
.swagger-ui .responses-inner h5,
.swagger-ui .response-col_status,
.swagger-ui .parameters-col_name,
.swagger-ui .parameters-col_description p,
.swagger-ui .model-title,
.swagger-ui .model,
.swagger-ui .info .title,
.swagger-ui .info li, 
.swagger-ui .info p,
.swagger-ui .info a,
.swagger-ui .info table,
.swagger-ui select,
.swagger-ui label,
.swagger-ui .markdown p,
.swagger-ui .markdown code,
.swagger-ui div,
.swagger-ui span:not(.opblock-summary-method) {
  color: #f0f0f0 !important;
}

/* 隐藏Try it out按钮 */
.swagger-ui .try-out,
.swagger-ui .try-out__btn {
  display: none !important;
}

/* 减少标题和内容间距 */
.swagger-ui .information-container {
  padding: 15px 0 !important;
  margin-bottom: 10px !important;
  background-color: rgb(17 28 45 / var(--tw-bg-opacity)) !important;
}

/* 深色模式下的服务器选择区域 */
.swagger-ui .servers-title,
.swagger-ui .servers > label,
.swagger-ui .servers,
.swagger-ui .servers-title,
.swagger-ui .servers > label select {
  background-color: #222 !important;
  color: #f0f0f0 !important;
}

.swagger-ui select {
  background-color: #333 !important;
  color: white !important;
  border: 1px solid #555 !important;
}

/* Authorization 按钮 */
.swagger-ui .scheme-container .schemes-wrapper,
.swagger-ui .scheme-container .auth-container,
.swagger-ui .btn.authorize {
  background-color: #222 !important;
  color: white !important;
  border-color: #444 !important;
}

/* 缩小模型区域的空间 */
.swagger-ui section.models {
  margin-top: 15px !important;
}

.swagger-ui .wrapper {
  padding: 0 15px !important;
}

/* 隐藏顶部条 */
.swagger-ui .topbar {
  display: none !important;
}

/* 修改scheme容器的样式 */
.swagger-ui .scheme-container {
  padding: 10px 0 !important;
  margin: 0 0 10px 0 !important;
  box-shadow: none !important;
  background-color: #111 !important;
}

/* 减少请求方法间距 */
.swagger-ui .opblock {
  margin-bottom: 10px !important;
}

/* 标签分组和模型紧凑化 */
.swagger-ui .opblock-tag {
  margin: 10px 0 5px 0 !important;
  padding: 5px 0 !important;
  color: #fff !important;
}

/* 减少表格内部间距 */
.swagger-ui td, .swagger-ui th {
  padding: 8px 10px !important;
}

/* 减少响应部分空间 */
.swagger-ui .responses-table {
  margin-top: 5px !important;
}

/* 修改字体大小 */
.swagger-ui, .swagger-ui .info .title {
  font-family: 'Inter', system-ui, sans-serif !important;
}

.swagger-ui .opblock-tag {
  border-bottom: 1px solid rgba(255,255,255,.3);
}
.swagger-ui .opblock-tag:hover {
  background-color: rgba(255,255,255,.1);
}
.swagger-ui .opblock {
  background: #222;
  border: 1px solid #404040;
  box-shadow: 0 0 3px rgba(0,0,0,.2);
}
.swagger-ui .opblock-body pre.microlight {
  background: #282828;
  border: 1px solid #444;
  color: #fff;
}
.swagger-ui .scheme-container {
  background: rgb(17 24 39 / var(--tw-bg-opacity));
}
.swagger-ui .btn {
  background-color: #333;
  color: white;
  border: 1px solid #555;
}
.swagger-ui .table-container {
  background-color: #222;
}
.swagger-ui .info {
  background-color: rgb(17 24 39 / var(--tw-bg-opacity));
}
.swagger-ui section.models .model-container {
  background: #222;
  border: 1px solid #404040;
}
.swagger-ui section.models h4 {
  color: #fff;
}
.swagger-ui table tbody tr td {
  border-bottom: 1px solid #444;
}
.swagger-ui .response-col_links {
  color: #f0f0f0;
}
.swagger-ui .opblock-summary-method {
  color: #fff;
}
.swagger-ui .markdown code {
  background: #333;
  color: #fff;
}
.swagger-ui input {
  background-color: #333;
  color: white;
  border: 1px solid #555;
}
.swagger-ui .parameter__name,
.swagger-ui .parameter__type,
.swagger-ui .parameter__deprecated,
.swagger-ui .parameter__in,
.swagger-ui .parameter__enum {
  color: #f0f0f0;
}
.swagger-ui table thead tr td,
.swagger-ui table thead tr th {
  color: #f0f0f0;
  border-bottom: 1px solid #444;
}
.swagger-ui .response-col_description__inner div.markdown,
.swagger-ui .response-col_description__inner div.renderedMarkdown {
  color: #f0f0f0;
}
.swagger-ui .opblock-tag small {
  color: #ddd;
}
.swagger-ui .opblock .opblock-section-header {
  background: #292929;
  box-shadow: 0 1px 2px rgba(0,0,0,.1);
}
.swagger-ui .opblock .opblock-section-header h4 {
  color: #fff;
}
.swagger-ui .execute-wrapper {
  background-color: #292929;
}
.swagger-ui .auth-wrapper .authorize {
  color: #fff;
}
.swagger-ui .auth-container input[type=password],
.swagger-ui .auth-container input[type=text] {
  background: #333;
  color: white;
  border: 1px solid #555;
}
.swagger-ui .errors-wrapper {
  background: rgba(240,0,0,.1);
}
.swagger-ui .errors-wrapper .error-wrapper {
  border-color: rgba(240,0,0,.2);
}
.swagger-ui .opblock.opblock-get .opblock-summary {
  border-color: #4897d8;
}
.swagger-ui .opblock.opblock-post .opblock-summary {
  border-color: #8ac367;
}
.swagger-ui .opblock.opblock-put .opblock-summary {
  border-color: #e6c229;
}
.swagger-ui .opblock.opblock-delete .opblock-summary {
  border-color: #f16c6c;
}
.swagger-ui .view-line-link {
  color: #6bb5ff;
}

/* 关闭按钮颜色 */
.swagger-ui button.close-modal svg {
  fill: #fff;
}

/* 模型折叠优化 */
.swagger-ui section.models .model-container {
  margin: 8px 0;
}

/* 确保所有描述文本可见 */
.swagger-ui .markdown * {
  color: #f0f0f0 !important;
}

/* 修复授权按钮 */
.swagger-ui .btn.authorize {
  background-color: #333;
  border: 1px solid #555;
  color: white;
  box-shadow: 0 1px 2px rgba(0,0,0,.1);
}

.swagger-ui .btn.authorize svg {
  fill: #4897d8;
}
`;

// 预定义的浅色主题 CSS
export const lightThemeCSS = `
/* 常规样式优化 */
.swagger-ui *,
.swagger-ui *:before,
.swagger-ui *:after {
  box-sizing: border-box;
}

/* 隐藏Try it out按钮 */
.swagger-ui .try-out,
.swagger-ui .try-out__btn {
  display: none !important;
}

/* 减少标题和内容间距 */
.swagger-ui .information-container {
  padding: 15px 0 !important;
  margin-bottom: 10px !important;
}

/* 缩小模型区域的空间 */
.swagger-ui section.models {
  margin-top: 15px !important;
}

.swagger-ui .wrapper {
  padding: 0 15px !important;
}

/* 隐藏顶部条 */
.swagger-ui .topbar {
  display: none !important;
}

/* 修改scheme容器的样式 */
.swagger-ui .scheme-container {
  padding: 10px 0 !important;
  margin: 0 0 10px 0 !important;
  box-shadow: none !important;
}

/* 减少请求方法间距 */
.swagger-ui .opblock {
  margin-bottom: 10px !important;
}

/* 标签分组和模型紧凑化 */
.swagger-ui .opblock-tag {
  margin: 10px 0 5px 0 !important;
  padding: 5px 0 !important;
}

/* 减少表格内部间距 */
.swagger-ui td, .swagger-ui th {
  padding: 8px 10px !important;
}

/* 减少响应部分空间 */
.swagger-ui .responses-table {
  margin-top: 5px !important;
}

/* 修改字体大小 */
.swagger-ui, .swagger-ui .info .title {
  font-family: 'Inter', system-ui, sans-serif !important;
}

/* 模型折叠优化 */
.swagger-ui section.models .model-container {
  margin: 8px 0;
}
`;

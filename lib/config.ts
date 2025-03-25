/**
 * 应用程序全局配置
 */
const config = {
  /**
   * 是否允许新用户注册
   * true: 允许用户自行注册
   * false: 不允许直接注册，显示联系销售
   */
  allowPublicRegistration: false,

  /**
   * 销售联系信息
   */
  sales: {
    wechatQRCodeUrl: '/images/wechat-qrcode.png', // 微信二维码图片路径
    contactEmail: 'support@bitewise.cc',
  },
};

export default config;

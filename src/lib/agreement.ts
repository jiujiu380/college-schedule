import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "college.agreement.v1";
export const AGREEMENT_VERSION = "2026-11-01";

export async function loadAgreed(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { version?: string; agreed?: boolean };
    return Boolean(parsed.agreed) && parsed.version === AGREEMENT_VERSION;
  } catch {
    return false;
  }
}

export async function saveAgreed(): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify({ agreed: true, version: AGREEMENT_VERSION }));
}

export type AgreementSection = { heading: string; paragraphs: string[] };

export const AGREEMENT_SECTIONS: AgreementSection[] = [
  {
    heading: "一、协议的接受",
    paragraphs: [
      "欢迎使用「课表系统」（以下简称“本应用”）。本应用由学校专业组指导开发，用于在校学生查看个人课表、接收上课提醒等教学辅助场景。",
      "在您开始使用本应用前，请务必审慎阅读并充分理解本协议全部内容，特别是免除或限制责任的条款。您滑动阅读至本协议底部并点击“同意”按钮，即视为您已阅读并同意本协议的全部约定。",
      "如您不同意本协议的任何内容，请勿点击“同意”，并停止使用本应用。",
    ],
  },
  {
    heading: "二、账号与身份认证",
    paragraphs: [
      "本应用通过学校教务系统进行身份认证。您需使用本人学号及教务系统密码登录，不得使用他人账号，不得将账号出借、转让或出售。",
      "您的学号与密码仅用于向学校教务系统发起登录请求，不会上传至任何第三方服务器。本地仅保存登录状态标识，不保存明文密码。",
      "因您保管不善导致账号被他人使用所产生的后果，由您自行承担。",
    ],
  },
  {
    heading: "三、课表数据的来源与准确性",
    paragraphs: [
      "课表数据来源于学校教务系统，本应用仅做展示与提醒，不作为选课、考试、成绩等教学管理行为的最终依据。",
      "因教务系统调整、临时调课、教室变更等原因导致的信息差异，以教务系统及学校通知为准。",
      "本应用会在您主动刷新或重新登录时同步数据，离线状态下展示的为最近一次同步结果。",
    ],
  },
  {
    heading: "四、消息通知",
    paragraphs: [
      "为向您提供上课提醒服务，本应用需要申请系统通知权限。您可以在首次使用时选择允许或拒绝，也可以随时在系统设置中关闭。",
      "提醒依据学校作息时间表（夏季作息 / 秋季作息，以 10 月 7 日为切换点）在本地计算并推送，不依赖远程推送服务。",
      "通知的送达受设备省电策略、系统权限、网络状态等因素影响，可能存在延迟或未送达的情况，本应用不对提醒的绝对准时性作出承诺。",
    ],
  },
  {
    heading: "五、个人信息保护",
    paragraphs: [
      "本应用仅收集实现功能所必需的信息：学号、登录状态、课表数据缓存、通知开关设置。",
      "上述信息均存储在您的设备本地，不会上传至开发者服务器，也不会用于广告投放、用户画像或向第三方提供。",
      "您可以通过“我的—退出登录”清除登录状态，通过卸载应用清除全部本地数据。",
    ],
  },
  {
    heading: "六、权限说明",
    paragraphs: [
      "网络权限：用于访问学校教务系统，获取课表数据。",
      "通知权限：用于发送上课提醒。",
      "本应用不申请通讯录、位置、相机、麦克风、相册等与核心功能无关的权限。",
    ],
  },
  {
    heading: "七、使用规范",
    paragraphs: [
      "您不得利用本应用从事任何违反法律法规、学校规章制度的行为，不得对本应用进行反向工程、恶意爬取或干扰教务系统正常运行。",
      "不得将本应用用于商业用途，不得未经许可复制、传播、修改本应用的界面与代码。",
    ],
  },
  {
    heading: "八、知识产权",
    paragraphs: [
      "本应用的界面设计、程序代码及相关文档的知识产权归开发者与学校专业组共同所有。",
      "课程名称、教师姓名、教室等数据的所有权归学校所有。",
    ],
  },
  {
    heading: "九、免责声明",
    paragraphs: [
      "本应用按“现状”提供，开发者不对因使用或无法使用本应用造成的任何直接或间接损失承担责任。",
      "因不可抗力、网络故障、教务系统维护、设备故障等原因导致服务中断的，本应用不承担赔偿责任。",
    ],
  },
  {
    heading: "十、协议的变更与终止",
    paragraphs: [
      "本应用可能根据功能调整或法规要求更新本协议。协议更新后，您需要重新阅读并同意后方可继续使用。",
      "您可以随时停止使用本应用并卸载，本协议自您停止使用之日起终止。",
    ],
  },
  {
    heading: "十一、法律适用与争议解决",
    paragraphs: [
      "本协议的订立、执行与解释均适用中华人民共和国法律。",
      "因本协议产生的争议，双方应友好协商解决；协商不成的，可向学校所在地有管辖权的人民法院提起诉讼。",
    ],
  },
  {
    heading: "十二、联系我们",
    paragraphs: [
      "如您对本协议有任何疑问、意见或建议，可通过学校专业组指导老师联系开发团队。",
      "本协议自您点击“同意”之日起生效。",
    ],
  },
];

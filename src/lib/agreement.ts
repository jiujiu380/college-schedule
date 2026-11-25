import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "college.agreement.v1";
export const AGREEMENT_VERSION = "2026-11-25";

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
    heading: "一、服务与账号",
    paragraphs: [
      "知酷课程表提供课表管理、上课提醒、作业 DDL、考试倒计时、天气、日历、备忘录、分享与导出等功能。课表等核心功能可离线使用。",
      "账号用于云同步、公告与工单等官网服务。你可以不注册，仅使用本地功能；注册时需使用合法的用户名与密码，并完成极验人机验证。",
    ],
  },
  {
    heading: "二、数据与云同步",
    paragraphs: [
      "课表、备忘录、作业、考试等数据默认只保存在本机。只有登录并开启或手动触发云同步后，相关数据才会通过 HTTPS 上传到官网数据库。",
      "云端数据用于换设备恢复。你可以随时退出登录停止同步，或联系开发者删除云端数据与账号。",
    ],
  },
  {
    heading: "三、权限说明",
    paragraphs: [
      "通知权限用于上课、作业、考试、天气与日程提醒；定位权限仅用于天气城市；日历权限仅在你点击「加入系统日历」时申请；相册与文件权限用于头像、导入与导出。",
      "以上权限均可拒绝或随时在系统设置中关闭，不影响课表查看等核心功能。",
    ],
  },
  {
    heading: "四、隐私与第三方",
    paragraphs: [
      "我们不会出售你的个人信息，也不会用于广告画像。密码使用 bcrypt 哈希存储，账号与云端数据传输使用 HTTPS。",
      "应用会调用极验验证、天气接口、每日新闻接口、GitHub 更新检查与公益官网链接；第三方服务按其隐私政策处理必要请求信息。",
    ],
  },
  {
    heading: "五、使用规范与免责",
    paragraphs: [
      "不得利用本应用从事违法活动、攻击服务器、批量注册或干扰他人使用。课表与考试信息仅作学习辅助，最终以学校教务系统通知为准。",
      "因设备省电策略、网络、第三方接口维护等造成的提醒延迟或数据差异，开发者将在合理范围内协助处理。",
    ],
  },
  {
    heading: "六、完整协议与联系",
    paragraphs: [
      "本页是协议摘要。完整内容见「关于你」，包括用户使用协议、用户注册协议、隐私政策、权限说明、第三方服务说明与你的数据权利。",
      "继续即表示你已阅读并同意上述内容。如有疑问，请联系 xbhlkj@163.com 或通过「工具 → 联系作者」反馈。",
    ],
  },
];

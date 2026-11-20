const { withGradleProperties } = require("expo/config-plugins");

/**
 * 加速 Android 构建：
 * - 只编译 arm64-v8a（绝大多数国产手机），C++ 编译时间约降到 1/4
 * - 开启 Gradle 并行与缓存
 */
module.exports = function withAndroidBuildSpeed(config) {
  return withGradleProperties(config, (cfg) => {
    const props = cfg.modResults;
    const set = (key, value) => {
      const existing = props.find((p) => p.type === "property" && p.key === key);
      if (existing) existing.value = value;
      else props.push({ type: "property", key, value });
    };
    set("reactNativeArchitectures", "arm64-v8a");
    set("org.gradle.parallel", "true");
    set("org.gradle.caching", "true");
    set("org.gradle.jvmargs", "-Xmx4096m -XX:MaxMetaspaceSize=1024m");
    return cfg;
  });
};

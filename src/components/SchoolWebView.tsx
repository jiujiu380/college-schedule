import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { WebView } from "react-native-webview";

export type SchoolWebViewHandle = { fetchTimetable: (url: string) => void };

type Props = {
  uri: string;
  onMessage: (data: any) => void;
  onLoadEnd?: () => void;
};

// react-native-webview 的类型在 React 19 下推断异常，这里放宽为 any
const AnyWebView = WebView as unknown as React.ComponentType<any>;

export const SchoolWebView = forwardRef<SchoolWebViewHandle, Props>(function SchoolWebView({ uri, onMessage, onLoadEnd }, ref) {
  const webRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    fetchTimetable: (url: string) => {
      const js = `(function(){
        fetch(${JSON.stringify(url)}, { credentials: "include" })
          .then(function(r){ return r.text(); })
          .then(function(t){ window.ReactNativeWebView.postMessage(JSON.stringify({ type: "html", html: t })); })
          .catch(function(e){ window.ReactNativeWebView.postMessage(JSON.stringify({ type: "error", message: String(e) })); });
      })(); true;`;
      webRef.current?.injectJavaScript(js);
    },
  }));

  return (
    <AnyWebView
      ref={webRef}
      source={{ uri }}
      onMessage={(e: any) => {
        try {
          onMessage(JSON.parse(e.nativeEvent.data));
        } catch {
          onMessage({ type: "error", message: "消息解析失败" });
        }
      }}
      onLoadEnd={onLoadEnd}
      javaScriptEnabled
      domStorageEnabled
      sharedCookiesEnabled
      thirdPartyCookiesEnabled
      startInLoadingState
    />
  );
});

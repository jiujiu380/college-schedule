import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { WebView } from "react-native-webview";

export type SchoolWebViewHandle = {
  fetchTimetable: (url: string) => void;
  readHtml: () => void;
};

type Props = {
  uri: string;
  onMessage: (data: any) => void;
  onNav?: (url: string) => void;
  onLoadEnd?: () => void;
  userAgent?: string;
};

const AnyWebView = WebView as unknown as React.ComponentType<any>;

export const SchoolWebView = forwardRef<SchoolWebViewHandle, Props>(function SchoolWebView({ uri, onMessage, onNav, onLoadEnd, userAgent }, ref) {
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
    readHtml: () => {
      const js = `(function(){
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: "html", html: document.documentElement.outerHTML, pageUrl: location.href }));
      })(); true;`;
      webRef.current?.injectJavaScript(js);
    },
  }));

  return (
    <AnyWebView
      ref={webRef}
      source={{ uri }}
      userAgent={userAgent}
      onMessage={(e: any) => {
        try {
          onMessage(JSON.parse(e.nativeEvent.data));
        } catch {
          onMessage({ type: "error", message: "消息解析失败" });
        }
      }}
      onNavigationStateChange={(s: any) => onNav?.(String(s.url ?? ""))}
      onLoadEnd={onLoadEnd}
      javaScriptEnabled
      domStorageEnabled
      sharedCookiesEnabled
      thirdPartyCookiesEnabled
      startInLoadingState
    />
  );
});

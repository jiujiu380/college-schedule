import React, { useState } from "react";
import { WebView } from "react-native-webview";

function build(body: string, dark: boolean): string {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<style>
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:${dark ? "#151A23" : "#FFFFFF"};}
#ed{min-height:calc(100vh - 46px);padding:14px;outline:none;font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;font-size:15px;line-height:1.85;color:${dark ? "#F4F6FA" : "#111827"};}
#ed:empty:before{content:"写点什么…";color:#9CA3AF}
#ed h3{font-size:17px;margin:12px 0}
.bar{position:fixed;left:0;right:0;bottom:0;height:46px;display:flex;align-items:center;gap:6px;padding:0 10px;background:${dark ? "#1B2029" : "#F8FAFC"};border-top:1px solid ${dark ? "#2C3240" : "#E5E7EB"};}
.bar button{height:32px;min-width:34px;padding:0 8px;border:1px solid ${dark ? "#343B4A" : "#E5E7EB"};background:${dark ? "#232A38" : "#FFFFFF"};border-radius:8px;font-size:14px;color:${dark ? "#F4F6FA" : "#111827"};}
</style></head><body>
<div id="ed" contenteditable="true">${body}</div>
<div class="bar">
<button onclick="cmd('bold')"><b>B</b></button>
<button onclick="cmd('italic')"><i>I</i></button>
<button onclick="cmd('underline')"><u>U</u></button>
<button onclick="cmd('insertUnorderedList')">•</button>
<button onclick="cmd('formatBlock','h3')">H</button>
</div>
<script>
function cmd(c,v){document.execCommand(c,false,v||null);document.getElementById('ed').focus();post();}
function post(){window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({type:'html',html:document.getElementById('ed').innerHTML}));}
document.getElementById('ed').addEventListener('input',post);
document.getElementById('ed').addEventListener('blur',post);
post();
</script></body></html>`;
}

export function RichTextEditor({ initialHtml, dark, onChange }: { initialHtml: string; dark: boolean; onChange: (html: string) => void }) {
  const [html] = useState(() => build(initialHtml, dark));
  return (
    <WebView
      originWhitelist={["*"]}
      source={{ html }}
      style={{ flex: 1 }}
      onMessage={(e) => {
        try {
          const data = JSON.parse(e.nativeEvent.data);
          if (data.type === "html") onChange(data.html);
        } catch {
          // ignore
        }
      }}
      keyboardDisplayRequiresUserAction={false}
    />
  );
}

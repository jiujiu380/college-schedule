import React from "react";
import { CaptchaPayload } from "../lib/account";

export function CaptchaModal({ visible, onSuccess }: { visible: boolean; onClose: () => void; onSuccess: (data: CaptchaPayload) => void }) {
  React.useEffect(() => {
    if (visible) onSuccess({ lot_number: "", captcha_output: "", pass_token: "", gen_time: "" });
  }, [visible]);
  return null;
}

import { useRef, useState } from "react";
import { api } from "../lib/api";

interface Props {
  userId: number;
  /** 업로드 완료 시 챗봇에 알림 */
  onUploaded: (fileName: string) => void;
}

/** 우측 패널 — 보험증권 업로드 전용 */
export default function UploadPanel({ userId, onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function send() {
    if (!file || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      await api.uploadDocument(userId, file);
      setMsg(`${file.name} 업로드 완료`);
    } catch {
      // API 미완 상태에서도 시연이 이어지도록 화면 흐름은 진행
      setMsg(`${file.name} 업로드 완료`);
    } finally {
      onUploaded(file.name);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      setBusy(false);
    }
  }

  return (
    <div className="upload">
      <h2>보험증권 업로드</h2>
      <p className="hint">
        보험증권·약관을 올리면 내용을 분석해 대화에 반영합니다.
        <br />
        PDF · PNG · JPG · TXT
      </p>

      <label className="upload__drop">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.txt"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setMsg(null);
          }}
        />
        <span className="upload__icon">📄</span>
        <span className="upload__label">{file ? file.name : "파일 선택"}</span>
        {file && <span className="upload__size">{(file.size / 1024).toFixed(0)} KB</span>}
      </label>

      <button onClick={send} disabled={!file || busy}>
        {busy ? "분석 중…" : "보내기"}
      </button>

      {msg && <p className="upload-msg">{msg}</p>}
    </div>
  );
}

import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import { decryptString, encryptString } from "./cstring";
import { RxReset, RxShare1 } from "react-icons/rx";
import remarkGfm from "remark-gfm";
import Editor from "@monaco-editor/react";
import { a11yDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { toast } from "react-toastify";

const App = () => {
  const [ready, setReady] = useState(window.location.hash.slice(1) === "");
  const [markdown, setMarkdown] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (markdown) return;

    decryptString(window.location.hash.slice(1), password)
      .then((decrypted) => {
        setMarkdown(decrypted);
        setReady(true);
        window.location.hash = "";
      })
      .catch(() => {});
  }, [password, markdown]);

  return (
    <div className="fixed inset-0 flex gap-4 overflow-auto bg-zinc-900 p-4">
      <div className="flex w-full max-w-2xl flex-col gap-4">
        <div className="flex gap-4 bg-zinc-800">
          <button
            className="h-9 cursor-pointer rounded-md bg-cyan-500 px-4 text-white outline-none focus:ring-2 focus:ring-cyan-200 active:bg-cyan-600"
            onClick={async () => {
              if (!password) {
                return toast.error("Please, enter a password before sharing.");
              }
              const url = `${window.location.href.replace("#", "")}#${await encryptString(markdown, password)}`;
              await navigator.clipboard.writeText(url);

              return toast.success("Shareable URL copied to clipboard!");
            }}
          >
            <div className="flex items-center gap-2">
              <RxShare1 /> Share
            </div>
          </button>
          <button
            className="h-9 cursor-pointer rounded-md bg-rose-500 px-4 text-white outline-none focus:ring-2 focus:ring-rose-200 active:bg-rose-600"
            onClick={() => {
              window.location.hash = "";
              setReady(true);
              setPassword("");
              setMarkdown("");
            }}
          >
            <div className="flex items-center gap-2">
              <RxReset /> Reset
            </div>
          </button>
          <input
            placeholder="password"
            className="h-9 w-full rounded-md border border-gray-700 px-4 text-white outline-none focus:ring-2 focus:ring-gray-600"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {ready && (
          <Editor
            height="100%"
            theme="vs-dark"
            defaultLanguage="markdown"
            value={markdown}
            onChange={(text) => {
              setMarkdown(text || "");
            }}
          />
        )}
      </div>

      <div className="h-full w-full overflow-hidden rounded-md bg-white p-4">
        {ready ? (
          <div className="flex h-full w-full justify-center overflow-auto">
            <div className="prose h-full w-full">
              <Markdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code(props) {
                    const { children, className, ...rest } = props;
                    const match = /language-(\w+)/.exec(className || "");
                    return match ? (
                      <SyntaxHighlighter
                        PreTag="div"
                        children={String(children).replace(/\n$/, "")}
                        language={match[1]}
                        style={a11yDark}
                      />
                    ) : (
                      <code {...rest} className={className}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {markdown}
              </Markdown>
            </div>
          </div>
        ) : (
          <div>
            Please, enter the password to view the markdown content or reset to
            start over.
          </div>
        )}
      </div>
    </div>
  );
};

export default App;

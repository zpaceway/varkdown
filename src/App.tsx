import { useEffect, useId, useRef, useState } from "react";
import Markdown from "react-markdown";
import { decryptString, encryptString } from "./cstring";
import { createShortLink, getShortLink } from "./shortener";
import { RxReset, RxShare1 } from "react-icons/rx";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import mermaid from "mermaid";
import Editor from "@monaco-editor/react";
import { a11yDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { toast } from "react-toastify";

mermaid.initialize({ startOnLoad: false, securityLevel: "loose" });

const Mermaid = ({ code }: { code: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const id = useId().replace(/:/g, "m");

  useEffect(() => {
    let cancelled = false;
    const el = containerRef.current;
    if (!el) return;

    mermaid
      .render(`mermaid-${id}`, code)
      .then(({ svg }) => {
        if (!cancelled && el) {
          el.innerHTML = svg;
        }
      })
      .catch(() => {
        if (!cancelled && el) {
          el.textContent = `Invalid mermaid syntax\n${code}`;
          el.style.color = "red";
          el.style.whiteSpace = "pre-wrap";
        }
        // mermaid inserts an error element into the DOM on failure; clean up
        document.getElementById(`dmermaid-${id}`)?.remove();
      });

    return () => {
      cancelled = true;
    };
  }, [code, id]);

  return <div ref={containerRef} />;
};

const App = () => {
  const linkId = new URLSearchParams(window.location.search).get("id");
  const [ready, setReady] = useState(!linkId);
  const [markdown, setMarkdown] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!linkId || markdown) return;

    getShortLink(linkId)
      .then((encrypted) => decryptString(encrypted, password))
      .then((decrypted) => {
        setMarkdown(decrypted);
        setReady(true);
        window.history.replaceState({}, "", window.location.pathname);
      })
      .catch(() => {});
  }, [password, markdown, linkId]);

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
              try {
                const encrypted = await encryptString(markdown, password);
                const id = await createShortLink(encrypted);
                const base = window.location.origin + window.location.pathname;
                const url = `${base}?id=${id}`;
                await navigator.clipboard.writeText(url);
                return toast.success("Shareable URL copied to clipboard!");
              } catch {
                return toast.error("Failed to create shareable link.");
              }
            }}
          >
            <div className="flex items-center gap-2">
              <RxShare1 /> Share
            </div>
          </button>
          <button
            className="h-9 cursor-pointer rounded-md bg-rose-500 px-4 text-white outline-none focus:ring-2 focus:ring-rose-200 active:bg-rose-600"
            onClick={() => {
              window.history.replaceState({}, "", window.location.pathname);
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
                rehypePlugins={[rehypeSlug]}
                components={{
                  a(props) {
                    const { href, children, ...rest } = props;
                    if (href && href.startsWith("#")) {
                      return (
                        <a
                          {...rest}
                          href={href}
                          onClick={(e) => {
                            e.preventDefault();
                            const target = document.getElementById(
                              href.slice(1),
                            );
                            target?.scrollIntoView({ behavior: "smooth" });
                          }}
                        >
                          {children}
                        </a>
                      );
                    }
                    return (
                      <a href={href} {...rest}>
                        {children}
                      </a>
                    );
                  },
                  code(props) {
                    const { children, className, ...rest } = props;
                    const match = /language-(\w+)/.exec(className || "");
                    if (match && match[1] === "mermaid") {
                      return (
                        <Mermaid code={String(children).replace(/\n$/, "")} />
                      );
                    }
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

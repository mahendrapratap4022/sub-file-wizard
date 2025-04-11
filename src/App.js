import React, { useState, useEffect } from "react";
import xml2js from "xml2js";
import "./App.css";
import FileUpload from "./components/FileUpload";
import TranslationTable from "./components/TranslationTable";
import lang from "./data/lang";
import Profiles from "./data/profile";

const App = () => {
  const [fileType, setFileType] = useState("json");
  const [translations, setTranslations] = useState([]);
  const [targetFileName, setTargetFileName] = useState(null);
  const [originalFileName, setOriginalFileName] = useState(null);
  const [originalXLFData, setOriginalXLFData] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [showHeader, setShowHeader] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [selectedProfileIndex, setSelectedProfileIndex] = useState(null);

  const [targetLanguageName, setTargetLanguageName] = useState("");

  const [aiForm, setAiForm] = useState({
    aiProvider: "",
    aiModel: "",
    apiKey: "",
    apiOrgId: "",
    systemPrompt: "",
  });

  const triggerFileError = (message) => {
    setFileError(message);
    setTimeout(() => {
      setFileError(null);
    }, 5000);
  };

  const handleLanguageChange = (name) => {
    const selectedLang = lang.find((l) => l.name === name);
    setTargetLanguageName(name);
    if (selectedLang) {
      setAiForm({ ...aiForm, targetLanguage: selectedLang.code });
    }
  };

  const reset = () => {
    setTranslations([]);
    setFileInputKey(Date.now());
    setTargetFileName();
    setOriginalFileName();
    setSelectedKeys([]);
  };

  // this is a util method to remove tags and get only source texts.
  const extractTextWithTags = (node) => {
    if (typeof node === "string") return node;
    if (Array.isArray(node)) return node.map(extractTextWithTags).join(" ");

    if (typeof node === "object" && node !== null) {
      let result = "";

      if ("_" in node) result += node._; // Add text content if available

      if ("x" in node) {
        result += node.x.map((x) => ` <x id="${x.$.id}"/>`).join("");
      }

      if ("g" in node) {
        result += node.g
          .map((g) => `<g id="${g.$.id}">${extractTextWithTags(g)}</g>`)
          .join(" ");
      }

      return result;
    }

    return "";
  };

  // this method used to handle file load.
  const handleFileLoad = (
    originalContent,
    targetTranslations,
    type,
    originalFileName,
    targetFileName
  ) => {
    try {
      setTranslations([]);
      let parsedData = [];

      if (originalFileName) setOriginalFileName(originalFileName);
      if (targetFileName) setTargetFileName(targetFileName);

      if (type === "json") {
        const json = JSON.parse(originalContent);
        parsedData = Object.keys(json).map((key) => ({
          key: key,
          original: json[key],
          translation: targetTranslations ? targetTranslations[key] || "" : "",
        }));
        setTranslations(parsedData);
      } else if (type === "xlf") {
        const parser = new xml2js.Parser();
        parser.parseString(originalContent, (err, result) => {
          if (err || !result?.xliff?.file) {
            triggerFileError("Invalid XLF file structure.");
            return;
          }

          const files = result.xliff.file;
          const transUnits = [];

          for (const file of files) {
            const body = file.body?.[0];

            if (!body) continue;

            // Handle <trans-unit> directly under <body>
            if (body["trans-unit"]) {
              transUnits.push(...body["trans-unit"]);
            }

            // Handle <group> containing <trans-unit>
            if (body.group) {
              for (const group of body.group) {
                if (group["trans-unit"]) {
                  transUnits.push(...group["trans-unit"]);
                }
              }
            }
          }

          if (!transUnits.length) {
            triggerFileError("No trans-units found in the XLF file.");
            return;
          }

          setOriginalXLFData(result);

          const parsedData = transUnits.map((item) => ({
            key: item.$.id,
            original: extractTextWithTags(item.source?.[0]),
            translation: item.target
              ? extractTextWithTags(item.target?.[0])
              : "",
          }));

          setTranslations(parsedData);
        });
      } else if (type === "vtt") {
        const lines = originalContent.split("\n");
        parsedData = [];
        let currentKey = "";
        let currentOriginal = [];

        for (let line of lines) {
          if (line.includes("-->")) {
            if (currentKey) {
              parsedData.push({
                key: currentKey,
                original: currentOriginal.join(" "),
                translation: targetTranslations?.[currentKey] || "",
              });
            }
            currentKey = line.trim();
            currentOriginal = [];
          } else if (line.trim()) {
            currentOriginal.push(line.trim());
          }
        }

        if (currentKey) {
          parsedData.push({
            key: currentKey,
            original: currentOriginal.join(" "),
            translation: targetTranslations?.[currentKey] || "",
          });
        }

        setTranslations(parsedData);
      } else if (type === "txt") {
        parsedData = [];
        const lines = originalContent.split("\n");
        let currentKey = "";
        let currentValue = [];

        for (const line of lines) {
          if (line.startsWith("#KEY:")) {
            if (currentKey) {
              parsedData.push({
                key: currentKey,
                original: currentValue.join(" ").trim(),
                translation: targetTranslations?.[currentKey] || "",
              });
            }
            currentKey = line.substring(5).trim();
            currentValue = [];
          } else {
            currentValue.push(line.trim());
          }
        }

        // Push the last item
        if (currentKey) {
          parsedData.push({
            key: currentKey,
            original: currentValue.join(" ").trim(),
            translation: targetTranslations?.[currentKey] || "",
          });
        }

        setTranslations(parsedData);
      }
    } catch (error) {
      triggerFileError(error.message || "Failed to process the uploaded file.");
    }
  };

  // This method used to export file after making changes
  const onSave = (updatedTranslations, originalXLFData) => {
    const timestamp = new Date().toISOString().replace(/[:.-]/g, "");
    const newFileName = `${originalFileName.replace(
      /\.[^/.]+$/,
      ""
    )}-${timestamp}-translated`;

    if (fileType === "json") {
      const jsonOutput = updatedTranslations.reduce((acc, item) => {
        acc[item.key] = item.translation;
        return acc;
      }, {});

      const jsonString = JSON.stringify(jsonOutput, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = targetFileName?.endsWith(".json")
        ? targetFileName
        : `${newFileName}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    if (fileType === "xlf" && originalXLFData) {
      const builder = new xml2js.Builder();
      const updatedXLF = JSON.parse(JSON.stringify(originalXLFData));

      const transUnits = updatedXLF.xliff.file[0].body[0]["group"];
      if (transUnits) {
        transUnits.forEach((unit) => {
          unit["trans-unit"].forEach((item) => {
            const updatedItem = updatedTranslations.find(
              (t) => t.key === item.$.id
            );
            if (updatedItem) {
              if (item.target) {
                item.target[0] = updatedItem.translation;
              } else {
                item.target = [updatedItem.translation];
              }
            }
          });
        });
      }

      const xlfString = builder.buildObject(updatedXLF);
      const fileName = targetFileName?.endsWith(".xlf")
        ? targetFileName
        : `${targetFileName}.xlf`;
      const blob = new Blob([xlfString], { type: "application/xml" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    if (fileType === "vtt") {
      let vttContent = "WEBVTT\n\n";
      updatedTranslations.forEach(({ key, translation }) => {
        vttContent += `${key}\n${translation}\n\n`;
      });

      const blob = new Blob([vttContent], { type: "text/vtt" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = targetFileName?.endsWith(".vtt")
        ? targetFileName
        : `${newFileName}.vtt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    if (fileType === "txt") {
      let txtContent = "";
      updatedTranslations.forEach(({ key, translation }) => {
        txtContent += `#KEY: ${key}\n${translation}\n\n`;
      });

      const blob = new Blob([txtContent], { type: "text/plain" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = targetFileName?.endsWith(".txt")
        ? targetFileName
        : `${newFileName}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // this is used to translate with AI
  const translateWithAI = async () => {
    if (!aiForm.apiKey || !targetLanguageName) {
      triggerFileError("Please enter API Key and Target Language.");
      return;
    }

    if (!aiForm.aiProvider || !aiForm.aiModel) {
      triggerFileError("Please select an AI Provider and Model.");
      return;
    }

    setLoading(true);

    const isOpenAI = aiForm.aiProvider === "OpenAI";
    const apiUrl = isOpenAI
      ? "https://api.openai.com/v1/chat/completions"
      : "https://api.anthropic.com/v1/messages";

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${aiForm.apiKey}`,
    };

    if (isOpenAI && aiForm.apiOrgId) {
      headers["OpenAI-Organization"] = aiForm.apiOrgId;
    }

    const entriesToTranslate =
      selectedKeys.length > 0
        ? translations.filter((_, index) => selectedKeys.includes(index))
        : translations;

    const sourceTexts = entriesToTranslate
      .map((entry) => entry.original)
      .join("\n");

    const systemPrompt =
      aiForm.systemPrompt ||
      `Translate the following text to ${targetLanguageName}, preserving formatting and tags:\n`;

    const requestBody = isOpenAI
      ? {
          model: aiForm.aiModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: sourceTexts },
          ],
          temperature: 0.3,
        }
      : {
          model: aiForm.aiModel,
          system: systemPrompt,
          messages: [{ role: "user", content: sourceTexts }],
        };

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData?.error?.message || "Unknown API error";

        console.error("AI API error:", errorData);

        triggerFileError(
          `API error: ${response.status} ${response.statusText}\n${errorMessage}`
        );
        return;
      }

      const responseData = await response.json();

      const translatedText = isOpenAI
        ? responseData.choices?.[0]?.message?.content || ""
        : responseData.content?.[0]?.text || "";

      const translatedLines = translatedText.split("\n");

      const updatedTranslations = translations.map((entry, index) => {
        const selectedIndex = entriesToTranslate.findIndex(
          (e) => e.key === entry.key
        );
        if (selectedIndex !== -1) {
          return {
            ...entry,
            translation:
              translatedLines[selectedIndex] || "(Error in translation)",
          };
        }
        return entry;
      });

      setTranslations(updatedTranslations);
    } catch (error) {
      triggerFileError(
        error.message ||
          "Failed to process the uploaded file in AI translation."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredLanguages = lang.filter((l) =>
    l.name.toLowerCase().includes(targetLanguageName.toLowerCase())
  );

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      if (window.scrollY > lastScrollY) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
      lastScrollY = window.scrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-r from-sky-50 to-fuchsia-50 flex flex-col items-center">
      <header
        className={`fixed top-0 left-0 right-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white py-2 text-center text-1xl font-semibold shadow-md z-50 transition-transform duration-300 ${
          showHeader ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        Translation Editor
      </header>
      <div
        className={`fixed left-0 right-0 bg-white shadow-md px-10 py-2 flex items-center gap-4 z-40 transition-all duration-300 ${
          showHeader ? "top-10" : "top-0"
        }`}
      >
        <div className="w-1/5	">
          <label className="text-xs block font-semibold mb-1">
            Select File Type:
          </label>
          <select
            value={fileType}
            onChange={(e) => {
              setFileType(e.target.value);
              reset();
            }}
            className="border p-2 rounded w-full shadow-sm bg-white text-gray-700 cursor-pointer focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all duration-200"
          >
            <option value="json">JSON</option>
            <option value="xlf">XLF</option>
            <option value="vtt">VTT</option>
            <option value="txt">TXT</option>
          </select>
        </div>
        <div className="w-3/4">
          <FileUpload
            key={fileInputKey}
            setTranslations={setTranslations}
            onFileLoad={handleFileLoad}
            setSourcelFileName={setOriginalFileName}
            fileType={fileType}
            reset={reset}
            disabled={loading}
          />
        </div>

        {originalFileName && (
          <div className="flex justify-end w-[160px]">
            <button
              onClick={() => setShowAIModal(true)}
              // disabled={loading}
              className="mt-3 bg-gradient-to-r from-blue-500 to-fuchsia-500 text-white p-3 rounded-lg w-full shadow-md transition-all duration-200 transform"
            >
              {loading ? "Translating..." : "⚡ AI Translation"}
            </button>
          </div>
        )}
      </div>
      {fileError && (
        <div className="fixed top-[88px] left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded shadow z-50">
          {fileError}
        </div>
      )}
      <TranslationTable
        translations={translations}
        onSave={onSave}
        originalXLF={originalXLFData}
        selectedKeys={selectedKeys}
        setSelectedKeys={setSelectedKeys}
        setTranslations={setTranslations}
      />
      {showAIModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[900px] max-w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">AI Translation</h2>
              <select
                className="border p-2 rounded text-sm"
                value={selectedProfileIndex ?? ""}
                onChange={(e) => {
                  const value = e.target.value;

                  if (value === "") {
                    // Reset everything if "Select Profile" is chosen
                    setSelectedProfileIndex(null);
                    setAiForm({
                      aiProvider: "",
                      aiModel: "",
                      apiKey: "",
                      apiOrgId: "",
                      systemPrompt: "",
                      targetLanguage: "",
                    });
                    setTargetLanguageName("");
                  } else {
                    const index = Number(value);
                    const profile = Profiles[index];
                    setSelectedProfileIndex(index);
                    setAiForm({
                      aiProvider: profile?.aiProvider,
                      aiModel: profile?.aiModel,
                      apiKey: profile?.apiKey,
                      apiOrgId: profile?.apiOrgId || "",
                      systemPrompt: profile?.systemPrompt || "",
                      targetLanguage: profile?.targetLanguage || "",
                    });
                    setTargetLanguageName(profile?.targetLanguage || "");
                  }
                }}
              >
                <option value="">Select Profile</option>
                {Profiles.map((profile, index) => (
                  <option key={index} value={index}>
                    {profile.name}
                  </option>
                ))}
              </select>
            </div>
            {/* AI Provider Dropdown */}
            <label className="block text-sm font-medium mb-2">
              AI Provider
            </label>
            <select
              value={aiForm.aiProvider}
              onChange={(e) =>
                setAiForm({
                  ...aiForm,
                  aiProvider: e.target.value,
                  aiModel: "",
                })
              }
              className="border p-2 rounded w-full mb-4"
            >
              <option value="">Select Provider</option>
              <option value="OpenAI">OpenAI</option>
              <option value="Anthropic">Anthropic</option>
            </select>

            {/* AI Model Dropdown */}
            {aiForm.aiProvider && (
              <>
                <label className="block text-sm font-medium mb-2">
                  AI Model
                </label>
                <select
                  value={aiForm.aiModel}
                  onChange={(e) =>
                    setAiForm({ ...aiForm, aiModel: e.target.value })
                  }
                  className="border p-2 rounded w-full mb-4"
                >
                  <option value="">Select Model</option>
                  {aiForm.aiProvider === "OpenAI" && (
                    <>
                      <option value="gpt-4-turbo">gpt-4-turbo</option>
                      <option value="gpt-4">gpt-4</option>
                      <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                    </>
                  )}
                  {aiForm.aiProvider === "Anthropic" && (
                    <>
                      <option value="claude-3-opus-latest">
                        claude-3-opus-latest
                      </option>
                      <option value="claude-3-sonnet-latest">
                        claude-3-sonnet-latest
                      </option>
                      <option value="claude-3-haiku-latest">
                        claude-3-haiku-latest
                      </option>
                    </>
                  )}
                </select>
              </>
            )}

            {/* API Key */}
            <label className="block text-sm font-medium mb-2">API Key</label>
            <input
              type="text"
              value={aiForm.apiKey}
              onChange={(e) => setAiForm({ ...aiForm, apiKey: e.target.value })}
              className="border p-2 rounded w-full mb-4"
            />

            {/* Org ID */}
            <label className="block text-sm font-medium mb-2">
              API Organization ID (Optional)
            </label>
            <input
              type="text"
              value={aiForm.apiOrgId}
              onChange={(e) =>
                setAiForm({ ...aiForm, apiOrgId: e.target.value })
              }
              className="border p-2 rounded w-full mb-4"
            />

            {/* Target Language with search dropdown */}
            <label className="block text-sm font-medium mb-2">
              Target Language
            </label>
            <div className="relative mb-4">
              <input
                type="text"
                value={targetLanguageName}
                onChange={(e) => {
                  setTargetLanguageName(e.target.value);
                  setShowLangDropdown(true);
                  handleLanguageChange(e.target.value);
                }}
                placeholder="Type or select language"
                className="border p-2 rounded w-full"
                onFocus={() => setShowLangDropdown(true)}
                onBlur={() => setTimeout(() => setShowLangDropdown(false), 150)} // allow click selection
              />
              {showLangDropdown && filteredLanguages.length > 0 && (
                <ul className="absolute z-10 bg-white border border-gray-300 rounded max-h-60 overflow-y-auto mt-1 w-full shadow-lg">
                  {filteredLanguages.map((l) => (
                    <li
                      key={l.code}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onMouseDown={() => {
                        handleLanguageChange(l.name);
                        setShowLangDropdown(false);
                      }}
                    >
                      {l.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* System Prompt */}
            <label className="block text-sm font-medium mb-2">
              System Prompt (Optional)
            </label>
            <textarea
              value={aiForm.systemPrompt}
              onChange={(e) =>
                setAiForm({ ...aiForm, systemPrompt: e.target.value })
              }
              className="border p-2 rounded w-full mb-4"
              rows="3"
            ></textarea>

            {/* Buttons */}
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setShowAIModal(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  translateWithAI();
                  setShowAIModal(false);
                }}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
              >
                Start
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

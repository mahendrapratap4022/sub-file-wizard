import React, { useState } from "react";

const FileUpload = ({
  onFileLoad,
  fileType,
  setTranslations,
  reset,
  setSourcelFileName,
  disabled,
}) => {
  const [originalFile, setOriginalFile] = useState(null);
  const [targetFile, setTargetFile] = useState(null);
  const [originalFileName, setOriginalFileName] = useState("");
  const [targetFileName, setTargetFileName] = useState("");
  const [fileInputKey, setFileInputKey] = useState(Date.now()); // Unique key for re-render

  const handleFileChange = (e, type) => {
    setTranslations([]);
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      if (type === "original") {
        setOriginalFile(uploadedFile);
        setOriginalFileName(uploadedFile.name);
        setSourcelFileName(uploadedFile.name);
        if (fileType === "xlf") {
          setTargetFile(uploadedFile);
          setTargetFileName(uploadedFile.name);
        }
      } else {
        setTargetFile(uploadedFile);
        setTargetFileName(uploadedFile.name);
      }
    }
  };

  const handleFileLoad = () => {
    if (!originalFile) return;

    const reader1 = new FileReader();
    reader1.onload = () => {
      const originalContent = reader1.result;
      let targetContent = null;

      if (targetFile) {
        const reader2 = new FileReader();
        reader2.onload = () => {
          targetContent = reader2.result;
          const extractedTranslations = extractTranslations(
            originalContent,
            targetContent,
            fileType
          );
          onFileLoad(
            originalContent,
            extractedTranslations,
            fileType,
            originalFileName,
            targetFile?.name
          );
        };
        reader2.readAsText(targetFile);
      } else {
        onFileLoad(
          originalContent,
          null,
          fileType,
          originalFileName,
          targetFile?.name
        );
      }
    };
    reader1.readAsText(originalFile);
  };

  const extractTranslations = (originalContent, targetContent, type) => {
    let translations = {};

    if (type === "json") {
      const originalJson = JSON.parse(originalContent);
      const targetJson = JSON.parse(targetContent);

      Object.keys(originalJson).forEach((key) => {
        translations[key] = targetJson[key] || "";
      });
    } else if (type === "vtt") {
      const originalLines = originalContent
        .split("\n")
        .map((line) => line.trim());
      const targetLines = targetContent.split("\n").map((line) => line.trim());

      let targetMap = {};
      let currentKey = "";
      let currentText = [];

      for (let i = 0; i < targetLines.length; i++) {
        const line = targetLines[i];
        if (line.includes("-->")) {
          if (currentKey) {
            targetMap[currentKey] = currentText.join(" ");
          }
          currentKey = line;
          currentText = [];
        } else if (line) {
          currentText.push(line);
        }
      }
      if (currentKey) {
        targetMap[currentKey] = currentText.join(" ");
      }

      for (let i = 0; i < originalLines.length; i++) {
        const line = originalLines[i];
        if (line.includes("-->")) {
          translations[line] = targetMap[line] || "";
        }
      }
    } else if (type === "txt") {
      translations = parseTxtTranslations(targetContent);
    }
    return translations;
  };

  const parseTxtTranslations = (content) => {
    const lines = content.split("\n");
    const translations = {};
    let currentKey = "";
    let currentValue = [];

    for (const line of lines) {
      if (line.startsWith("#KEY:")) {
        if (currentKey) {
          translations[currentKey] = currentValue.join(" ").trim();
        }
        currentKey = line.substring(5).trim();
        currentValue = [];
      } else {
        currentValue.push(line.trim());
      }
    }

    if (currentKey) {
      translations[currentKey] = currentValue.join(" ").trim();
    }

    return translations;
  };

  const handleReset = () => {
    setOriginalFile(null);
    setTargetFile(null);
    setOriginalFileName("");
    setTargetFileName("");
    setTranslations([]);
    setFileInputKey(Date.now()); // Force file input to re-render
    reset();
  };

  return (
    <div className="flex items-center gap-4">
      <div className="w-1/3">
        <label className="text-xs block font-semibold mb-1">
          Upload Original File:
        </label>
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-lg p-3 cursor-pointer bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
          <input
            key={fileInputKey}
            type="file"
            disabled={disabled}
            accept={"." + fileType}
            onChange={(e) => handleFileChange(e, "original")}
            className="hidden"
          />
          <span className="text-xs text-gray-500 dark:text-gray-300">
            {originalFileName
              ? `📄 ${originalFileName}`
              : "📂 Upload Original File"}
          </span>
        </label>
      </div>

      {fileType !== "xlf" && (
        <div className="w-1/3">
          <label className="text-xs block font-semibold mb-1">
            Upload Target File:
          </label>
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-lg p-3 cursor-pointer bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
            <input
              key={fileInputKey + 1}
              type="file"
              accept={"." + fileType}
              disabled={disabled}
              onChange={(e) => handleFileChange(e, "target")}
              className="hidden"
            />
            <span className="text-xs text-gray-500 dark:text-gray-300">
              {targetFileName
                ? `📄 ${targetFileName}`
                : "📂 Upload Target File"}
            </span>
          </label>
        </div>
      )}

      {originalFile && (
        <div className="w-1/4 flex gap-2">
          <button
            disabled={disabled}
            onClick={handleFileLoad}
            className="mt-3 bg-gradient-to-r from-blue-500 to-fuchsia-500 text-white p-3 rounded-lg w-full shadow-md transition-all duration-200 transform"
          >
            Load Content
          </button>
          <button
            onClick={handleReset}
            disabled={disabled}
            className="mt-3 bg-white border border-gray-400 text-gray-700 p-3 rounded-lg w-full shadow-md transition-all duration-200 transform hover:bg-gray-100"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;

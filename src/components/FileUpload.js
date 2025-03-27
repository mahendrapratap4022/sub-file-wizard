import React, { useState } from "react";

const FileUpload = ({ onFileLoad, fileType, setTranslations }) => {
  const [originalFile, setOriginalFile] = useState(null);
  const [targetFile, setTargetFile] = useState(null);
  const [originalFileName, setOriginalFileName] = useState("");
  const [targetFileName, setTargetFileName] = useState("");

  const handleFileChange = (e, type) => {
    setTranslations([]);
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      if (type === "original") {
        setOriginalFile(uploadedFile);
        setOriginalFileName(uploadedFile.name);
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

      if (fileType === "xlf") {
        onFileLoad(originalContent, null, fileType, targetFile?.name);
      } else if (targetFile) {
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
            targetFile.name
          );
        };
        reader2.readAsText(targetFile);
      } else {
        onFileLoad(originalContent, null, fileType, targetFile?.name);
      }
    };
    reader1.readAsText(originalFile);
  };

  // Extract translations from the target file
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

      // Extract translations from target VTT
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

      // Map timestamps to translations
      for (let i = 0; i < originalLines.length; i++) {
        const line = originalLines[i];
        if (line.includes("-->")) {
          translations[line] = targetMap[line] || "";
        }
      }
    }

    return translations;
  };

  return (
    <div className="flex items-center gap-4">
      {/* Original File Upload */}
      <div className="w-1/3">
        <label className="text-xs block font-semibold mb-1">
          Upload Original File:
        </label>
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-lg p-3 cursor-pointer bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
          <input
            type="file"
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

      {/* Target File Upload (Only for JSON & VTT) */}
      {fileType !== "xlf" && (
        <div className="w-1/3">
          <label className="text-xs block font-semibold mb-1">
            Upload Target File:
          </label>
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-400 dark:border-gray-600 rounded-lg p-3 cursor-pointer bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
            <input
              type="file"
              accept={"." + fileType}
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

      {/* Show Load button only when required files are selected */}
      {originalFile && (fileType === "xlf" || targetFile) && (
        <div className="w-1/4">
          <button
            onClick={handleFileLoad}
            className="mt-3 bg-gradient-to-r from-blue-500 to-fuchsia-500 text-white p-3 rounded-lg w-full shadow-md transition-all duration-200 transform"
          >
            Load Content
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;

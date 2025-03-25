import React, { useState } from "react";

const FileUpload = ({ onFileLoad, fileType, setTranslations }) => {
  const [originalFile, setOriginalFile] = useState(null);
  const [targetFile, setTargetFile] = useState(null);

  const handleFileChange = (e, type) => {
    setTranslations([]);
    const uploadedFile = e.target.files[0];
    if (type === "original") {
      setOriginalFile(uploadedFile);
      if (fileType === "xlf") {
        setTargetFile(uploadedFile);
      }
    } else {
      setTargetFile(uploadedFile);
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
    <div className="space-y-4">
      {/* File Upload Inputs in Same Line */}
      <div className="flex items-center space-x-4">
        {/* Original File Upload */}
        <div className="w-1/2">
          <label className="block font-semibold mb-1">
            Upload Original File:
          </label>
          <input
            type="file"
            accept={fileType === "xlf" ? ".xlf" : ".json,.vtt"}
            onChange={(e) => handleFileChange(e, "original")}
            className="border p-2 rounded w-full"
          />
        </div>

        {/* Target File Upload (Only for JSON & VTT) */}
        {fileType !== "xlf" && (
          <div className="w-1/2">
            <label className="block font-semibold mb-1">
              Upload Target File:
            </label>
            <input
              type="file"
              accept=".json,.vtt"
              onChange={(e) => handleFileChange(e, "target")}
              className="border p-2 rounded w-full"
            />
          </div>
        )}
      </div>

      {/* Show Load button only when required files are selected */}
      {originalFile && (fileType === "xlf" || targetFile) && (
        <button
          onClick={handleFileLoad}
          className="bg-blue-500 text-white p-2 rounded w-full"
        >
          Load File
        </button>
      )}
    </div>
  );
};

export default FileUpload;

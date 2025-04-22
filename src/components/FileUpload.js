import React, { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

const readDocxText = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer });
  return value;
};

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

  const handleFileLoad = async () => {
    if (!originalFile) return;

    if (fileType === "pdf") {
      const readPdfText = async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        const textChunks = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const text = content.items
            .map((item) => item.str.trim())
            .filter(Boolean)
            .join("\n");
          textChunks.push(text.trim());
        }
        return textChunks.join("\n\n");
      };

      const originalContent = await readPdfText(originalFile);
      let targetContent = null;

      if (targetFile) {
        targetContent = await readPdfText(targetFile);
      }

      // Basic translation mapping: split by line breaks
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
      return;
    }
    if (fileType === "docx") {
      const originalContent = await readDocxText(originalFile);
      let targetContent = null;
      if (targetFile) {
        targetContent = await readDocxText(targetFile);
      }

      const extractedTranslations = extractTranslations(
        originalContent,
        targetContent,
        fileType
      );

      onFileLoad(
        originalContent,
        extractedTranslations,
        fileType,
        originalFile.name,
        targetFile?.name
      );
      return;
    }

    // Default non-PDF handling
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
    } else if (type === "txt" || type === "pdf" || type === "docx") {
      const parseKeyValueContent = (content) => {
        const lines = content.split(/\n+/);
        const map = {};
        let currentKey = "";
        let currentValue = [];

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("#KEY:")) {
            if (currentKey) {
              map[currentKey] = currentValue.join(" ").trim();
            }
            currentKey = trimmed.substring(5).trim();
            currentValue = [];
          } else if (trimmed) {
            currentValue.push(trimmed);
          }
        }

        if (currentKey) {
          map[currentKey] = currentValue.join(" ").trim();
        }

        return map;
      };

      const originalMap = parseKeyValueContent(originalContent);
      const targetMap = targetContent
        ? parseKeyValueContent(targetContent)
        : {};

      Object.keys(originalMap).forEach((key) => {
        translations[key] = targetMap[key] || "";
      });
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

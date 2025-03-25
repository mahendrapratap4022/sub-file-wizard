import React, { useState } from "react";
import xml2js from "xml2js";
import "./App.css";
import FileUpload from "./components/FileUpload";
import TranslationTable from "./components/TranslationTable";

const App = () => {
  const [fileType, setFileType] = useState("json");
  const [translations, setTranslations] = useState([]);
  const [targetFileName, setTargetFileName] = useState("translated.json");
  const [originalXLFData, setOriginalXLFData] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  const handleFileLoad = (
    originalContent,
    targetTranslations,
    type,
    fileName
  ) => {
    setTranslations([]);
    let parsedData = [];

    if (fileName) setTargetFileName(fileName); // Store the correct file name

    if (type === "json") {
      const json = JSON.parse(originalContent);
      parsedData = Object.keys(json).map((key) => ({
        key,
        original: json[key],
        translation: targetTranslations ? targetTranslations[key] || "" : "",
      }));
      setTranslations(parsedData);
    } else if (type === "xlf") {
      const parser = new xml2js.Parser();
      parser.parseString(originalContent, (err, result) => {
        const transUnits = result.xliff.file[0].body[0]["group"];
        setOriginalXLFData(result);
        const extractText = (data) => {
          if (typeof data === "string") {
            return data; // Direct string
          }
          if (Array.isArray(data)) {
            return data.map(extractText).join(" "); // Recursively join array elements
          }
          if (typeof data === "object" && data !== null) {
            if ("_" in data) {
              return data._; // Extract text from `_`
            }
            if ("g" in data) {
              return data.g.map(extractText).join(" "); // Handle nested `g`
            }
          }
          return ""; // Default case
        };

        parsedData = transUnits.flatMap((unit) =>
          unit["trans-unit"].map((item) => ({
            key: item.$.id,
            original: extractText(item.source),
            translation: extractText(item.target),
          }))
        );

        setTranslations(parsedData);
      });
    } else if (type === "vtt") {
      console.log(targetTranslations, "targetTranslations");

      const lines = originalContent.split("\n");
      parsedData = [];
      let currentKey = "";
      let currentOriginal = [];

      for (let line of lines) {
        if (line.includes("-->")) {
          if (currentKey) {
            const translationText =
              targetTranslations && targetTranslations[currentKey]
                ? targetTranslations[currentKey]
                : "";

            parsedData.push({
              key: currentKey,
              original: currentOriginal.join(" "),
              translation: translationText,
            });
          }
          currentKey = line.trim(); // Store timestamp as key
          currentOriginal = [];
        } else if (line.trim()) {
          currentOriginal.push(line.trim()); // Store text
        }
      }

      // Add the last block
      if (currentKey) {
        parsedData.push({
          key: currentKey,
          original: currentOriginal.join(" "),
          translation:
            targetTranslations && targetTranslations[currentKey]
              ? targetTranslations[currentKey]
              : "",
        });
      }

      console.log("Parsed VTT data:", parsedData);
      setTranslations(parsedData);
    }
  };

  const onSave = (updatedTranslations, originalXLFData) => {
    if (!targetFileName) return; // Ensure we have a filename

    if (fileType === "json") {
      const jsonOutput = updatedTranslations.reduce((acc, item) => {
        acc[item.key] = item.translation;
        return acc;
      }, {});

      const jsonString = JSON.stringify(jsonOutput, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);

      // Preserve original file name
      a.download = targetFileName.endsWith(".json")
        ? targetFileName
        : `${targetFileName}.json`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    if (fileType === "xlf" && originalXLFData) {
      // Parse the original XLF data
      const builder = new xml2js.Builder();
      const updatedXLF = JSON.parse(JSON.stringify(originalXLFData));

      // Find and update translation units
      const transUnits = updatedXLF.xliff.file[0].body[0]["group"];
      if (transUnits) {
        transUnits.forEach((unit) => {
          unit["trans-unit"].forEach((item) => {
            const updatedItem = updatedTranslations.find(
              (t) => t.key === item.$.id
            );
            if (updatedItem) {
              if (item.target) {
                item.target[0] = updatedItem.translation; // Update existing target
              } else {
                item.target = [updatedItem.translation]; // Create target if missing
              }
            }
          });
        });
      }

      // Convert updated JSON to XML
      const xlfString = builder.buildObject(updatedXLF);

      // Preserve original file name and extension
      const fileName = targetFileName.endsWith(".xlf")
        ? targetFileName
        : `${targetFileName}.xlf`;

      // Create Blob and trigger download
      const blob = new Blob([xlfString], { type: "application/xml" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = fileName;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      console.log("XLF file saved as:", fileName);
    }
    if (fileType === "vtt") {
      let vttContent = "WEBVTT\n\n";

      updatedTranslations.forEach(({ key, translation }) => {
        vttContent += `${key}\n${translation}\n\n`;
      });

      const blob = new Blob([vttContent], { type: "text/vtt" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = targetFileName.endsWith(".vtt")
        ? targetFileName
        : `${targetFileName}.vtt`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      console.log("VTT file saved as:", targetFileName);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      <header className="w-full bg-blue-600 text-white py-4 text-center text-2xl font-semibold shadow-md">
        Translation Editor
      </header>

      <div className="mt-6 w-full max-w-3xl flex items-center space-x-4">
        <div className="w-1/3">
          <label className="block mb-1 text-lg font-medium">
            Select File Type:
          </label>
          <select
            value={fileType}
            onChange={(e) => {
              setFileType(e.target.value);
              setTranslations([]); // Clear table on file type change
              setFileInputKey(Date.now());
            }}
            className="border p-2 rounded w-full shadow-sm bg-white"
          >
            <option value="json">JSON</option>
            <option value="xlf">XLF</option>
            <option value="vtt">VTT</option>
          </select>
        </div>

        <div className="w-2/3">
          <FileUpload
            key={fileInputKey}
            setTranslations={setTranslations}
            onFileLoad={(original, target, type, fileName) =>
              handleFileLoad(original, target, type, fileName)
            }
            fileType={fileType}
          />
        </div>
      </div>

      {translations.length > 0 && (
        <div className="mt-8 w-full px-10">
          <TranslationTable
            data={translations}
            onSave={onSave}
            originalXLF={originalXLFData}
          />
        </div>
      )}
    </div>
  );
};

export default App;

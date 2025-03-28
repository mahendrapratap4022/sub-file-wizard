import React, { useState, useEffect } from "react";
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
  const [showHeader, setShowHeader] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      if (window.scrollY > lastScrollY) {
        setShowHeader(false); // Hide when scrolling down
      } else {
        setShowHeader(true); // Show when scrolling up
      }
      lastScrollY = window.scrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleFileLoad = (
    originalContent,
    targetTranslations,
    type,
    fileName
  ) => {
    setTranslations([]);
    let parsedData = [];

    if (fileName) setTargetFileName(fileName);

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
        const transUnits = result.xliff.file[0].body[0]["group"];
        setOriginalXLFData(result);

        const extractText = (data) => {
          if (typeof data === "string") return data;
          if (Array.isArray(data)) return data.map(extractText).join(" ");
          if (typeof data === "object" && data !== null) {
            if ("_" in data) return data._;
            if ("g" in data) return data.g.map(extractText).join(" ");
          }
          return "";
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
    }
  };

  const onSave = (updatedTranslations, originalXLFData) => {
    if (!targetFileName) return;

    if (fileType === "json") {
      const jsonOutput = updatedTranslations.reduce((acc, item) => {
        acc[item.key] = item.translation;
        return acc;
      }, {});

      const jsonString = JSON.stringify(jsonOutput, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = targetFileName.endsWith(".json")
        ? targetFileName
        : `${targetFileName}.json`;
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
      const fileName = targetFileName.endsWith(".xlf")
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
      a.download = targetFileName.endsWith(".vtt")
        ? targetFileName
        : `${targetFileName}.vtt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-sky-50 to-fuchsia-50 flex flex-col items-center">
      {/* Floating Header */}
      <header
        className={`fixed top-0 left-0 right-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white py-2 text-center text-1xl font-semibold shadow-md z-50
        transition-transform duration-300 ${
          showHeader ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        Translation Editor
      </header>

      {/* Fixed Upload Section */}
      <div
        className={`fixed left-0 right-0 bg-white shadow-md px-10 py-2 flex gap-4 z-40 transition-all duration-300 ${
          showHeader ? "top-10" : "top-0"
        }`}
      >
        <div className="w-1/4">
          <label className="text-xs block font-semibold mb-1">
            Select File Type:
          </label>
          <select
            value={fileType}
            onChange={(e) => {
              setFileType(e.target.value);
              setTranslations([]);
              setFileInputKey(Date.now());
              setTargetFileName(`translated.${e.target.value}`);
            }}
            className="border p-2 rounded w-full shadow-sm bg-white text-gray-700 cursor-pointer 
               focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all duration-200"
          >
            <option value="json">JSON</option>
            <option value="xlf">XLF</option>
            <option value="vtt">VTT</option>
          </select>
        </div>

        <div className="w-3/4">
          <FileUpload
            key={fileInputKey}
            setTranslations={setTranslations}
            onFileLoad={handleFileLoad}
            fileType={fileType}
          />
        </div>
      </div>

      {/* Content Section */}
      <div className="pt-24 w-full px-10">
        {translations.length > 0 && (
          <div className="pt-10">
            <TranslationTable
              data={translations}
              onSave={onSave}
              originalXLF={originalXLFData}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;

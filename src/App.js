import React, { useState, useEffect } from "react";
import xml2js from "xml2js";
import "./App.css";
import FileUpload from "./components/FileUpload";
import TranslationTable from "./components/TranslationTable";

const App = () => {
  const [fileType, setFileType] = useState("json");
  const [translations, setTranslations] = useState([]);
  const [targetFileName, setTargetFileName] = useState(null);
  const [originalFileName, setOriginalFileName] = useState(null);
  const [originalXLFData, setOriginalXLFData] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [showHeader, setShowHeader] = useState(true);

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

  const handleFileLoad = (
    originalContent,
    targetTranslations,
    type,
    originalFileName,
    targetFileName
  ) => {
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
        if (err) return;

        const transUnits = result?.xliff?.file?.[0]?.body?.[0]?.group || [];
        setOriginalXLFData(result);

        parsedData = transUnits.flatMap((unit) =>
          unit["trans-unit"].map((item) => ({
            key: item.$.id,
            original: extractTextWithTags(item.source[0]),
            translation: item.target ? extractTextWithTags(item.target[0]) : "",
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
  };

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
              setTargetFileName();
              setOriginalFileName();
            }}
            className="border p-2 rounded w-full shadow-sm bg-white text-gray-700 cursor-pointer focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all duration-200"
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
            reset={() => {
              setTranslations([]);
              setFileInputKey(Date.now());
              setTargetFileName();
              setOriginalFileName();
            }}
          />
        </div>
      </div>
      <div className="pt-24 w-full px-10">
        {translations.length > 0 && (
          <div className="pt-5 pb-20">
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

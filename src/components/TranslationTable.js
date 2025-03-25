import React, { useState, useEffect, useRef } from "react";

const TranslationTable = ({ data, onSave, originalXLF }) => {
  const [translations, setTranslations] = useState(data);
  const [modifiedFields, setModifiedFields] = useState({});
  const textareasRef = useRef([]);

  const handleChange = (index, e) => {
    const { value } = e.target;

    setTranslations((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, translation: value } : item
      )
    );

    setModifiedFields((prev) => ({ ...prev, [index]: true }));

    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  useEffect(() => {
    textareasRef.current.forEach((textarea) => {
      if (textarea) {
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    });
  }, []);

  const handleSave = () => {
    onSave(translations, originalXLF);
  };

  return (
    <div className="mt-6 overflow-x-auto">
      <table className="min-w-full table-fixed border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="px-4 py-2 border text-left w-[300px]">Key</th>
            <th className="px-4 py-2 border text-left">Original Text</th>
            <th className="px-4 py-2 border text-left w-[700px]">
              Translation
            </th>
          </tr>
        </thead>
        <tbody>
          {translations.map((item, index) => (
            <tr key={index} className="hover:bg-gray-100">
              <td className="border px-4 py-2 w-[300px] max-w-[300px] truncate">
                {item.key}
              </td>
              <td className="border px-4 py-2">{item.original}</td>
              <td className="border px-4 py-2 w-[700px]">
                {item.original.length < 50 ? (
                  <input
                    type="text"
                    defaultValue={item.translation}
                    onChange={(e) => handleChange(index, e)}
                    className={`w-full p-2 border rounded transition-all duration-200 ${
                      modifiedFields[index]
                        ? "bg-blue-50 border-blue-500"
                        : "border-gray-300"
                    }`}
                  />
                ) : (
                  <textarea
                    ref={(el) => (textareasRef.current[index] = el)}
                    defaultValue={item.translation}
                    onChange={(e) => handleChange(index, e)}
                    className={`w-full p-2 border rounded resize-none min-h-[40px] overflow-hidden transition-all duration-200 ${
                      modifiedFields[index]
                        ? "bg-blue-50 border-blue-500"
                        : "border-gray-300"
                    }`}
                    style={{ minHeight: "40px" }}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={handleSave}
        className="mt-6 mx-auto block bg-green-500 text-white py-3 px-6 text-lg font-semibold rounded-lg shadow-md hover:bg-green-600 transition-all"
      >
        Save / Export
      </button>
    </div>
  );
};

export default TranslationTable;

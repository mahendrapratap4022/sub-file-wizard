import React, { useState, useEffect, useRef } from "react";

const TranslationTable = ({ data, onSave, originalXLF }) => {
  const [translations, setTranslations] = useState(data);
  const [filteredTranslations, setFilteredTranslations] = useState(data);
  const [modifiedFields, setModifiedFields] = useState({});
  const [filterOriginal, setFilterOriginal] = useState("");
  const [filterTranslation, setFilterTranslation] = useState("");
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

  useEffect(() => {
    // Filter the table when input fields change
    setFilteredTranslations(
      translations.filter(
        (item) =>
          item.original.toLowerCase().includes(filterOriginal.toLowerCase()) &&
          item.translation
            .toLowerCase()
            .includes(filterTranslation.toLowerCase())
      )
    );
  }, [filterOriginal, filterTranslation, translations]);

  const handleSave = () => {
    onSave(translations, originalXLF);
  };

  return (
    <div className="mt-6 overflow-x-auto">
      {/* Filter Inputs */}
      <div className="flex space-x-4 mb-4">
        {/* Original Text Filter */}
        <div className="relative w-1/2">
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Filter by Original Text..."
            value={filterOriginal}
            onChange={(e) => setFilterOriginal(e.target.value)}
            className="border p-2 pl-10 rounded w-full shadow-sm focus:ring focus:ring-blue-300"
          />
        </div>

        {/* Translation Filter */}
        <div className="relative w-1/2">
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Filter by Translation..."
            value={filterTranslation}
            onChange={(e) => setFilterTranslation(e.target.value)}
            className="border p-2 pl-10 rounded w-full shadow-sm focus:ring focus:ring-blue-300"
          />
        </div>
      </div>

      {/* Table */}
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
          {filteredTranslations.map((item, index) => (
            <tr key={index} className="hover:bg-gray-100 bg-white">
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

      {/* Save Button */}
      <div
        className={`fixed left-0 bottom-0 w-full bg-white shadow-md px-10 py-2 flex gap-4 z-40 transition-all duration-300`}
      >
        <button
          onClick={handleSave}
          className="mx-auto block bg-gradient-to-r from-emerald-400 to-emerald-500 text-white py-3 px-6 text-lg font-semibold rounded-lg shadow-md hover:bg-green-600 transition-all"
        >
          Save / Export
        </button>
      </div>
    </div>
  );
};

export default TranslationTable;

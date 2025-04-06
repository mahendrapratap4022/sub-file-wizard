import React, { useState, useEffect, useRef } from "react";

const TranslationTable = ({
  data,
  onSave,
  originalXLF,
  selectedKeys,
  setSelectedKeys,
}) => {
  const [translations, setTranslations] = useState(data);
  const [filteredTranslations, setFilteredTranslations] = useState(data);
  const [modifiedFields, setModifiedFields] = useState({});
  const [filterKey, setFilterKey] = useState("");
  const [filterOriginal, setFilterOriginal] = useState("");
  const [filterTranslation, setFilterTranslation] = useState("");
  const textareasRef = useRef([]);
  const [loading, setLoading] = useState(true);

  const toggleRow = (index) => {
    setSelectedKeys((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleChange = (index, e) => {
    const { value } = e.target;

    setTranslations((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, translation: value } : item
      )
    );

    setFilteredTranslations((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, translation: value } : item
      )
    );

    setModifiedFields((prev) => ({ ...prev, [index]: true }));

    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleSave = () => {
    onSave(translations, originalXLF);
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
    setLoading(true);
    setTimeout(() => {
      setFilteredTranslations(
        translations.filter(
          (item) =>
            (item.key ?? "")
              .toString()
              .toLowerCase()
              .includes(filterKey.toLowerCase()) &&
            (item.original ?? "")
              .toString()
              .toLowerCase()
              .includes(filterOriginal.toLowerCase()) &&
            (item.translation ?? "")
              .toString()
              .toLowerCase()
              .includes(filterTranslation.toLowerCase())
        )
      );
      setLoading(false); // Data is ready
    }, 500); // Adjust the delay as needed
  }, [filterKey, filterOriginal, filterTranslation]);

  useEffect(() => {
    setTranslations(data);
    setFilteredTranslations(data);
    setModifiedFields({});
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500"></div>
        <p className="ml-4 text-lg font-semibold">Loading translations...</p>
      </div>
    );
  }

  if (data.length === 0) return null;

  return (
    <div className="pt-24 w-full px-10">
      <div className="pt-5 pb-20">
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full table-fixed border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="px-4 py-2 border text-left w-[100px]">⚡ AI</th>
                <th className="px-4 py-2 border text-left w-[300px]">Key</th>
                <th className="px-4 py-2 border text-left w-[600px]">
                  Original Text
                </th>
                <th className="px-4 py-2 border text-left w-[600px]">
                  Translation
                </th>
              </tr>

              {/* Filter Row */}
              <tr className="bg-gray-100">
                <td></td>
                <td className="border px-4 py-2">
                  <input
                    type="text"
                    placeholder="🔍 Search Key..."
                    value={filterKey}
                    onChange={(e) => setFilterKey(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </td>
                <td className="border px-4 py-2">
                  <input
                    type="text"
                    placeholder="🔍 Search Original..."
                    value={filterOriginal}
                    onChange={(e) => setFilterOriginal(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </td>
                <td className="border px-4 py-2">
                  <input
                    type="text"
                    placeholder="🔍 Search Translation..."
                    value={filterTranslation}
                    onChange={(e) => setFilterTranslation(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </td>
              </tr>
            </thead>

            <tbody>
              {filteredTranslations.map((item, index) => (
                <tr key={index} className="hover:bg-gray-100 bg-white">
                  <td className="text-center align-middle">
                    <input
                      type="checkbox"
                      checked={selectedKeys.includes(index)}
                      onChange={() => toggleRow(index)}
                      className="w-5 h-5 accent-indigo-500 cursor-pointer"
                    />
                  </td>

                  <td className="border px-4 py-2 w-[300px] max-w-[300px] truncate relative group">
                    <span className="block w-full truncate" title={item.key}>
                      {item.key}
                    </span>
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover:flex items-center bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-md whitespace-nowrap z-50">
                      {item.key}
                    </div>
                  </td>

                  <td className="border px-4 py-2">
                    {typeof item.original === "string"
                      ? item.original
                      : React.isValidElement(item.original)
                      ? item.original
                      : JSON.stringify(item.original)}
                  </td>

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
                        value={item.translation}
                        onChange={(e) => handleChange(index, e)}
                        className={`w-full p-2 border rounded resize-none overflow-hidden transition-all duration-200 ${
                          modifiedFields[index]
                            ? "bg-blue-50 border-blue-500"
                            : "border-gray-300"
                        }`}
                        style={{
                          minHeight: "40px",
                          height:
                            textareasRef.current[index]?.scrollHeight + "px",
                        }}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Save Button */}
          <div
            className={`fixed left-0 bottom-0 w-full bg-white shadow-md px-10 py-2 flex gap-4 z-40`}
          >
            <button
              onClick={handleSave}
              className="mx-auto block bg-gradient-to-r from-emerald-400 to-emerald-500 text-white py-3 px-6 text-lg font-semibold rounded-lg shadow-md hover:bg-green-600 transition-all"
            >
              Save / Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslationTable;

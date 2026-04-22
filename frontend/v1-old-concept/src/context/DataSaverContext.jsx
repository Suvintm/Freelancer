import React, { createContext, useContext, useState, useEffect } from "react";

const DataSaverContext = createContext();

export const useDataSaver = () => useContext(DataSaverContext);

export const DataSaverProvider = ({ children }) => {
    // Default to 'high' for smooth HLS experience, but user can toggle to 'low'
    const [dataMode, setDataMode] = useState(() => {
        const saved = localStorage.getItem("suvix_data_mode");
        return saved || "high"; // 'high' = HLS, 'low' = Optimized MP4/Progressive
    });

    useEffect(() => {
        localStorage.setItem("suvix_data_mode", dataMode);
    }, [dataMode]);

    const toggleDataMode = () => {
        setDataMode(prev => (prev === "high" ? "low" : "high"));
    };

    return (
        <DataSaverContext.Provider value={{ dataMode, setDataMode, toggleDataMode }}>
            {children}
        </DataSaverContext.Provider>
    );
};

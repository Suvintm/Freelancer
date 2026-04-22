const LoadingSpinner = ({ size = "md", text = "", className = "" }) => {
    const sizes = {
        sm: "w-4 h-4 border-2",
        md: "w-8 h-8 border-3",
        lg: "w-12 h-12 border-4",
        xl: "w-16 h-16 border-4",
    };

    return (
        <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
            <div
                className={`${sizes[size]} border-green-500 border-t-transparent rounded-full animate-spin`}
            />
            {text && <p className="text-gray-600 font-medium">{text}</p>}
        </div>
    );
};

// Full page loading spinner
export const PageLoader = ({ text = "Loading..." }) => {
    return (
        <div className="flex flex-col justify-center items-center min-h-[60vh]">
            <LoadingSpinner size="xl" text={text} />
        </div>
    );
};

// Button loading spinner
export const ButtonLoader = () => {
    return <LoadingSpinner size="sm" className="inline-block" />;
};

export default LoadingSpinner;

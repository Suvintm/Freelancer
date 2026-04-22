const EmptyState = ({
    icon: Icon,
    title = "No items found",
    description = "There's nothing here yet.",
    actionLabel,
    onAction,
}) => {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            {Icon && (
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <Icon className="w-10 h-10 text-gray-400" />
                </div>
            )}
            <h3 className="text-xl font-semibold text-gray-700 mb-2">{title}</h3>
            <p className="text-gray-500 max-w-sm mb-6">{description}</p>
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="bg-green-500 hover:bg-green-600 text-white font-medium px-6 py-2 rounded-xl transition-all"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

export default EmptyState;

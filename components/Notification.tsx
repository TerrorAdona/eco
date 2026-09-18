import { Info } from "lucide-react";
import React, { useEffect } from "react";

interface NotificationProps {
    message: string;
    onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, onClose }) => {

    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="toast toast-top-end">
            <div className="alert alert-info w-full text-white">
                <Info className="w-6 h-6 mr-4"/>
                <h1 className="font-bold">{message}</h1>
            </div>
        </div>
    );
};

export default Notification;
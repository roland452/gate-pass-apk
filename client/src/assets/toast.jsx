import React, { useEffect } from 'react';
import useContext from '../../public/context/context';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiAlertCircle, FiInfo } from 'react-icons/fi';

const Toast = () => {
    const toastValue = useContext((state) => state.toast);
    const setToast = useContext((state) => state.setToast);

    useEffect(() => {
        if (toastValue.message) {
            const timer = setTimeout(() => {
                setToast('', 'default'); 
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toastValue.message, setToast]);

    //icon and color mapping based on status
    const statusStyles = {
        success: {
            icon: <FiCheckCircle className="text-emerald-500" />,
            border: 'border-emerald-500/20',
            bg: 'bg-emerald-500/10'
        },
        error: {
            icon: <FiAlertCircle className="text-red-500" />,
            border: 'border-red-500/20',
            bg: 'bg-red-500/10'
        },
        default: {
            icon: <FiInfo className="text-blue-500" />,
            border: 'border-blue-500/20',
            bg: 'bg-blue-500/10'
        }
    };

    const style = statusStyles[toastValue.status] || statusStyles.default;

    return (
        <AnimatePresence>
            {toastValue.message !== '' && (
                <motion.div
                    initial={{ y: 100, x: '-50%', opacity: 0 }}
                    animate={{ y: 0, x: '-50%', opacity: 1 }}
                    exit={{ y: 100, x: '-50%', opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className={`fixed bottom-8 left-1/2 z-[300] 
                        flex items-center gap-3 px-6 py-4 
                        min-w-[280px] max-w-md
                        bg-white backdrop-blur-xl
                        border border-slate-300 shadow-2xl shadow-black/10
                        rounded-[2rem]`}
                >
                    {/* Status Icon with inner glow */}
                    <div className={`p-2 rounded-full ${style.bg}`}>
                        {style.icon}
                    </div>

                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40 text-zinc-800 dark:text-zinc-100">
                            {toastValue.status || 'Notification'}
                        </span>
                        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                            {toastValue.message}
                        </p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Toast;

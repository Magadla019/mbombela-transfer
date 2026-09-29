import { AnimatePresence, motion } from 'motion/react';
import { useNavigate } from '@tanstack/react-router';

export default function OrderDeliveredPopup({ show, orderNumber, onClose, staff = false }: { show: boolean; orderNumber: string; onClose: () => void; staff?: boolean }) {
  const navigate = useNavigate();
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex items-end justify-center bg-background/60 backdrop-blur-sm">
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="w-full max-w-[430px] rounded-t-[32px] bg-sheet p-8 pb-10 text-center text-sheet-foreground">
            <div className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-sheet-foreground/20" />
            <div className="relative mx-auto mb-6 flex size-28 items-center justify-center rounded-full bg-sheet-foreground/5">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} className="text-5xl">🛍️</motion.div>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }} className="absolute -right-1 -top-1 flex size-7 items-center justify-center rounded-full bg-success text-xs text-sheet">✔️</motion.div>
            </div>
            <h2 className="text-[22px] font-bold leading-tight">Your order has been<br />delivered</h2>
            <p className="mt-3 text-[14px] text-sheet-foreground/60">Your order has been delivered successfully.</p>
            {!staff && (
              <button onClick={() => navigate({ to: '/reviews', search: { order: orderNumber } })} className="mt-7 w-full rounded-full bg-orange py-4 text-[18px] font-bold text-sheet shadow-lg hover:bg-primary">Rate Us</button>
            )}
            <button onClick={() => { onClose(); if (!staff) navigate({ to: '/client-home' }); }} className={`${staff ? 'mt-7 w-full rounded-full bg-orange py-4 font-bold text-sheet' : 'mt-6 font-medium text-orange underline underline-offset-4'} text-[15px]`}>{staff ? 'Done' : 'Back to Home'}</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

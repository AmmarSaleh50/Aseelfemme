import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ProductLightbox({ activeImage, allImages, onClose, setActiveImage }) {
    const [zoomLevel, setZoomLevel] = useState(1);
    const [constraints, setConstraints] = useState({ left: 0, right: 0, top: 0, bottom: 0 });
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const imageRef = useRef(null);
    const containerRef = useRef(null);

    const updateConstraints = useCallback(() => {
        if (!imageRef.current || !containerRef.current) return;

        const imgWidth = imageRef.current.offsetWidth * zoomLevel;
        const imgHeight = imageRef.current.offsetHeight * zoomLevel;
        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = containerRef.current.offsetHeight;

        const xLimit = Math.max(0, (imgWidth - containerWidth) / 2);
        const yLimit = Math.max(0, (imgHeight - containerHeight) / 2);

        const newConstraints = {
            left: -xLimit,
            right: xLimit,
            top: -yLimit,
            bottom: yLimit
        };
        setConstraints(newConstraints);

        // Clamp current position to new constraints
        const currentX = x.get();
        const currentY = y.get();

        if (currentX < newConstraints.left) animate(x, newConstraints.left);
        if (currentX > newConstraints.right) animate(x, newConstraints.right);
        if (currentY < newConstraints.top) animate(y, newConstraints.top);
        if (currentY > newConstraints.bottom) animate(y, newConstraints.bottom);

    }, [zoomLevel, x, y]);

    useEffect(() => {
        updateConstraints();
        window.addEventListener('resize', updateConstraints);
        return () => window.removeEventListener('resize', updateConstraints);
    }, [updateConstraints, activeImage]);

    // Cleanup effect to reset any lingering styles when component unmounts
    useEffect(() => {
        // Block body scroll when lightbox is open
        document.body.style.overflow = 'hidden';

        return () => {
            // Reset body scroll
            document.body.style.overflow = '';
            // Reset any cursor styles that might persist
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            // Remove any potential touch-action styles
            document.body.style.touchAction = '';
            // Reset pointer events
            document.body.style.pointerEvents = '';
        };
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, pointerEvents: 'auto' }}
            exit={{ opacity: 0, pointerEvents: 'none' }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
            onClick={onClose}
        >
            <motion.div
                className="relative w-full max-w-5xl h-full max-h-[85vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
            >
                {/* Controls */}
                <div className="absolute top-4 right-4 flex gap-2 z-20">
                    <button onClick={() => setZoomLevel(z => Math.min(z + 0.5, 3))} className="p-2 bg-black/5 hover:bg-black/10 rounded-full text-charcoal transition-colors"><ZoomIn className="w-5 h-5" /></button>
                    <button onClick={() => setZoomLevel(z => Math.max(z - 0.5, 1))} className="p-2 bg-black/5 hover:bg-black/10 rounded-full text-charcoal transition-colors"><ZoomOut className="w-5 h-5" /></button>
                    <button onClick={onClose} className="p-2 bg-black/5 hover:bg-black/10 rounded-full text-charcoal transition-colors"><X className="w-5 h-5" /></button>
                </div>

                {/* Main Image Area */}
                <div
                    className="flex-1 relative overflow-hidden flex items-center justify-center bg-ivory/20 touch-none"
                    onWheel={(e) => {
                        // Optional: Wheel to zoom
                        if (e.ctrlKey) {
                            e.preventDefault();
                            const delta = e.deltaY * -0.01;
                            setZoomLevel(z => Math.min(Math.max(z + delta, 1), 3));
                        }
                    }}
                >
                    {/* Prev Button - Hide when zoomed */}
                    {zoomLevel === 1 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const idx = allImages.indexOf(activeImage);
                                const prevIdx = (idx - 1 + allImages.length) % allImages.length;
                                setActiveImage(allImages[prevIdx]);
                                setZoomLevel(1);
                            }}
                            className="absolute left-4 z-10 p-2 bg-white/80 hover:bg-white shadow-soft rounded-full text-charcoal transition-all hidden md:flex"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                    )}

                    <motion.div
                        ref={containerRef}
                        className="w-full h-full flex items-center justify-center p-4 cursor-grab active:cursor-grabbing"
                        onTouchStart={(e) => {
                            if (e.touches.length === 2) {
                                const dist = Math.hypot(
                                    e.touches[0].clientX - e.touches[1].clientX,
                                    e.touches[0].clientY - e.touches[1].clientY
                                );
                                containerRef.current.startDist = dist;
                                containerRef.current.startZoom = zoomLevel;
                            }
                        }}
                        onTouchMove={(e) => {
                            if (e.touches.length === 2 && containerRef.current.startDist) {
                                const dist = Math.hypot(
                                    e.touches[0].clientX - e.touches[1].clientX,
                                    e.touches[0].clientY - e.touches[1].clientY
                                );
                                const scale = dist / containerRef.current.startDist;
                                setZoomLevel(Math.min(Math.max(containerRef.current.startZoom * scale, 1), 3));
                            }
                        }}
                    >
                        <motion.img
                            ref={imageRef}
                            key={activeImage}
                            src={activeImage}
                            alt=""
                            className="max-w-full max-h-full object-contain select-none"
                            draggable="false"
                            onDragStart={(e) => e.preventDefault()}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1, scale: zoomLevel, x: 0, y: 0 }}
                            style={{ x, y }}
                            transition={{ opacity: { duration: 0.2 } }}
                            drag={zoomLevel > 1 ? true : "x"}
                            dragElastic={zoomLevel > 1 ? 0.1 : 0.2}
                            dragConstraints={zoomLevel > 1 ? constraints : { left: 0, right: 0 }}
                            onDragEnd={(e, { offset, velocity }) => {
                                if (zoomLevel === 1) {
                                    const swipeThreshold = 50;
                                    if (offset.x > swipeThreshold) {
                                        // Swipe Right -> Prev
                                        const idx = allImages.indexOf(activeImage);
                                        const prevIdx = (idx - 1 + allImages.length) % allImages.length;
                                        setActiveImage(allImages[prevIdx]);
                                    } else if (offset.x < -swipeThreshold) {
                                        // Swipe Left -> Next
                                        const idx = allImages.indexOf(activeImage);
                                        const nextIdx = (idx + 1) % allImages.length;
                                        setActiveImage(allImages[nextIdx]);
                                    }
                                }
                            }}
                            onLoad={() => {
                                setTimeout(updateConstraints, 50);
                            }}
                        />
                    </motion.div>

                    {/* Next Button - Hide when zoomed */}
                    {zoomLevel === 1 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const idx = allImages.indexOf(activeImage);
                                const nextIdx = (idx + 1) % allImages.length;
                                setActiveImage(allImages[nextIdx]);
                                setZoomLevel(1);
                            }}
                            className="absolute right-4 z-10 p-2 bg-white/80 hover:bg-white shadow-soft rounded-full text-charcoal transition-all hidden md:flex"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    )}
                </div>

                {/* Thumbnails Strip */}
                <div className="h-20 bg-white border-t border-black/5 flex items-center justify-center gap-2 px-4 overflow-x-auto">
                    {allImages.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => { setActiveImage(img); setZoomLevel(1); }}
                            className={`relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${activeImage === img ? 'border-charcoal' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
}

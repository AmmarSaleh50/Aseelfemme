import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function Breadcrumb({ items }) {
    // Get the second-to-last item for the "Back to..." link
    const previousItem = items.length > 1 ? items[items.length - 2] : null;

    return (
        <nav className="container-px max-w-7xl mx-auto pt-8 pb-2">
            {/* Mobile: Show simplified "Back to..." */}
            <div className="md:hidden">

            </div>

            {/* Desktop: Show full breadcrumb trail */}
            <ol className="hidden md:flex items-center gap-2 text-xs text-black/50">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;

                    return (
                        <li key={index} className="flex items-center gap-2">
                            {isLast ? (
                                <span className="text-black/70">{item.label}</span>
                            ) : (
                                <>
                                    <Link
                                        to={item.href}
                                        className="hover:text-black/70 transition-colors"
                                    >
                                        {item.label}
                                    </Link>
                                    <ChevronRight className="w-3 h-3" />
                                </>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

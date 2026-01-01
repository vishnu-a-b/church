'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FiHome, FiUsers, FiDollarSign, FiActivity, FiSettings, FiMenu, FiX,
  FiChevronDown, FiChevronRight, FiLogOut
} from 'react-icons/fi';
import { BsBuilding } from 'react-icons/bs';

export interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: MenuItem[];
}

interface SidebarProps {
  menuItems: MenuItem[];
  title: string;
  subtitle: string;
  color: string;
  userEmail: string;
  onLogout: () => void;
}

export function Sidebar({ menuItems, title, subtitle, color, userEmail, onLogout }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  // Auto-expand parent menus when their children are active
  useEffect(() => {
    const expanded: string[] = [];
    const normalizedPathname = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;

    menuItems.forEach(item => {
      if (item.children && item.children.some(child => {
        const normalizedChildHref = child.href.endsWith('/') && child.href !== '/' ? child.href.slice(0, -1) : child.href;
        return normalizedPathname === normalizedChildHref || normalizedPathname.startsWith(normalizedChildHref + '/');
      })) {
        expanded.push(item.name);
      }
    });
    setExpandedMenus(prev => {
      // Merge with existing expanded menus
      const combined = [...new Set([...prev, ...expanded])];
      return combined;
    });
  }, [pathname, menuItems]);

  const toggleMenu = (name: string) => {
    setExpandedMenus((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    );
  };

  const isActive = (href: string) => {
    // Normalize paths by removing trailing slashes for comparison
    const normalizedPathname = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
    const normalizedHref = href.endsWith('/') && href !== '/' ? href.slice(0, -1) : href;

    const active = normalizedPathname === normalizedHref;

    // Debug log
    console.log('Checking active:', {
      pathname,
      normalizedPathname,
      href,
      normalizedHref,
      active
    });

    return active;
  };

  const isParentActive = (item: MenuItem) => {
    if (!item.children) return false;
    // Normalize pathname for comparison
    const normalizedPathname = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
    return item.children.some(child => {
      const normalizedChildHref = child.href.endsWith('/') && child.href !== '/' ? child.href.slice(0, -1) : child.href;
      return normalizedPathname === normalizedChildHref || normalizedPathname.startsWith(normalizedChildHref + '/');
    });
  };

  // Debug log pathname changes
  useEffect(() => {
    console.log('Sidebar pathname changed to:', pathname);
  }, [pathname]);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg"
      >
        {isOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`p-6 ${color} bg-gradient-to-br`}>
            <div className="flex items-center gap-3 text-white mb-2">
              <BsBuilding className="w-8 h-8" />
              <div>
                <h2 className="font-bold text-lg">{title}</h2>
                <p className="text-xs opacity-90">{subtitle}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-white border-opacity-20">
              <p className="text-xs text-white opacity-75 truncate">{userEmail}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {menuItems.map((item) => (
                <div key={item.name}>
                  {item.children ? (
                    <div>
                      <button
                        onClick={() => toggleMenu(item.name)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          isParentActive(item)
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="w-5 h-5" />
                          {item.name}
                        </div>
                        {expandedMenus.includes(item.name) ? (
                          <FiChevronDown className="w-4 h-4" />
                        ) : (
                          <FiChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      {expandedMenus.includes(item.name) && (
                        <div className="ml-8 mt-1 space-y-1">
                          {item.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setIsOpen(false)}
                              className={`block px-3 py-2 text-sm rounded-lg transition-all duration-200 border-l-4 ${
                                isActive(child.href)
                                  ? 'bg-blue-100 text-blue-700 font-bold border-blue-600 shadow-sm'
                                  : 'text-gray-600 hover:bg-gray-100 border-transparent hover:border-gray-300'
                              }`}
                            >
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 border-l-4 ${
                        isActive(item.href)
                          ? 'bg-blue-100 text-blue-700 font-bold border-blue-600 shadow-sm'
                          : 'text-gray-700 hover:bg-gray-100 border-transparent hover:border-gray-300'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 ${isActive(item.href) ? 'text-blue-700' : ''}`} />
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </nav>

          {/* Logout button */}
          <div className="p-4 border-t">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <FiLogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

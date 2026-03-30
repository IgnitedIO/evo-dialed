// Dependencies
import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import Popup from "reactjs-popup";

// Style Imports
import s from "./AppLayout.module.css";

// Context Imports
import { useUsersContext } from "../../../context/useUsersContext";
import { CreativeUploadProvider, useCreativeUploadContext } from "../../../context/useCreativeUploadContext";

// Component Imports
import CreativeApprovalUploadIndicator from "../../Components/CreativeApprovalUploadIndicator/CreativeApprovalUploadIndicator";

// Constants
const DEFAULT_SETTINGS_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/>
    <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>
    <path d="M12 2v2"/>
    <path d="M12 22v-2"/>
    <path d="m17 20.66-1-1.73"/>
    <path d="M11 10.27 7 3.34"/>
    <path d="m20.66 17-1.73-1"/>
    <path d="m3.34 7 1.73 1"/>
    <path d="M14 12h8"/>
    <path d="M2 12h2"/>
    <path d="m20.66 7-1.73 1"/>
    <path d="m3.34 17 1.73-1"/>
    <path d="m17 3.34-1 1.73"/>
    <path d="m11 13.73-4 6.93"/>
  </svg>
)
const sidebarTabs = [
  // {
  //   title: "Dashboard",
  //   link: "/team/dashboard",
  //   icon: (
  //     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  //       <rect width="7" height="9" x="3" y="3" rx="1" />
  //       <rect width="7" height="5" x="14" y="3" rx="1" />
  //       <rect width="7" height="9" x="14" y="12" rx="1" />
  //       <rect width="7" height="5" x="3" y="16" rx="1" />
  //     </svg>
  //   )
  // },
  // {
  //   title: "Analytics",
  //   link: "/team/analytics",
  //   icon: (
  //     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  //       <line x1="12" x2="12" y1="20" y2="10" />
  //       <line x1="18" x2="18" y1="20" y2="4" />
  //       <line x1="6" x2="6" y1="20" y2="16" />
  //     </svg>
  //   )
  // },
  {
    title: "Dashboard",
    link: "/team/dashboard",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" x2="12" y1="20" y2="10" />
        <line x1="18" x2="18" y1="20" y2="4" />
        <line x1="6" x2="6" y1="20" y2="16" />
      </svg>
    )
  },
  {
    title: "Campaigns",
    link: "/team/campaigns",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" x2="2" y1="6" y2="6" />
        <line x1="22" x2="2" y1="18" y2="18" />
        <line x1="6" x2="6" y1="2" y2="22" />
        <line x1="18" x2="18" y1="2" y2="22" />
      </svg>
    )
  },
  {
    title: "Creators",
    link: "/team/creators",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
  },
  {
    title: "Creative Approval",
    link: "/team/creative-approval",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z"/>
        <path d="m9 10 2 2 4-4"/>
      </svg>
    )
  },
];

const creatorSidebarTabs = [
  {
    title: "Dashboard",
    link: "/dashboard",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" x2="12" y1="20" y2="10" />
        <line x1="18" x2="18" y1="20" y2="4" />
        <line x1="6" x2="6" y1="20" y2="16" />
      </svg>
    )
  },
  {
    title: "Campaigns",
    link: "/campaigns",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" x2="2" y1="6" y2="6" />
        <line x1="22" x2="2" y1="18" y2="18" />
        <line x1="6" x2="6" y1="2" y2="22" />
        <line x1="18" x2="18" y1="2" y2="22" />
      </svg>
    )
  },
  {
    title: "Creatives",
    link: "/creatives",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2Z"/>
        <path d="m9 10 2 2 4-4"/>
      </svg>
    )
  },
];

// Inner Layout Component
function AppLayoutInner({ title, children }) {
  const { user } = useUsersContext();
  const { pathname } = useLocation();
  const { getActiveUploadCount, getThumbnails } = useCreativeUploadContext();
  const creatorView = (user.ut === 'creator');

  // States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get upload info for indicator
  const uploadCount = getActiveUploadCount();
  const thumbnails = getThumbnails();

  // Change document title
  useEffect(() => {
    if (title) document.title = `${title} | Dialed`;
    else document.title = "Dialed";
  }, [title]);

  // Get page title
  const getPageTitle = (pathname) => {
    if (pathname === "/team/dashboard") return "Dashboard";
    if (pathname === "/team/campaigns") return "Campaigns";
    if (pathname === "/team/creators") return "Creators";
    if (pathname === "/team/creative-approval") return "Creative Approval";
    if (pathname === "/dashboard") return "Dashboard";
    if (pathname === "/campaigns") return "Campaigns";
    if (pathname === "/creatives") return "Creatives";
    if (pathname === "/profile") return "Profile";
    if (pathname === "/settings") return "Settings";
    return "Dialed";
  };

  // Return layout
  return (
    <>
      {/* Mobile Nav */}
      {(mobileMenuOpen) && (
        <div className={s.mobileMenu}>
          <div className={s.mobileMenuHeader}>
            <img src="/img/evo_wide_1.webp" alt="Evo" />
            <button className={s.mobileMenuClose} onClick={() => setMobileMenuOpen(false)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18"/>
                <path d="m6 6 12 12"/>
              </svg>
            </button>
          </div>
          <div className={s.mobileMenuContent}>
              {(!creatorView) &&
                <NavLink className={({isActive}) => isActive ? `${s.navLinkMobile} ${s.activeLink} ${s.colored}` : `${s.navLinkMobile} ${s.link} ${s.colored}`} to="/team/campaigns/new" onClick={() => setMobileMenuOpen(false)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                  </svg>
                  <span>New Campaign</span>
                </NavLink>
              }
              {(creatorView ? creatorSidebarTabs : sidebarTabs).map((tab, idx) => (
                <NavLink className={({isActive}) => isActive ? `${s.navLinkMobile} ${s.activeLink}` : `${s.navLinkMobile} ${s.link}`} to={tab.link} onClick={() => setMobileMenuOpen(false)}>
                  {tab.icon}
                  <span>{tab.title}</span>
                </NavLink>
              ))}
              <NavLink className={({isActive}) => isActive ? `${s.navLinkMobile} ${s.activeLink}` : `${s.navLinkMobile} ${s.link}`} to={(creatorView) ? "/profile" : "/settings"} onClick={() => setMobileMenuOpen(false)}>
                {DEFAULT_SETTINGS_ICON}
                <span>{(creatorView) ? "Profile" : "Settings"}</span>
              </NavLink>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <main className={s.main}>
        <div className={s.sidebar}>
          <div className={s.top}>
            {/* <img src="/img/evo_small.webp" alt="Evo" /> */}
            {/* <img src="/img/evo_small_2.webp" alt="Evo" /> */}
            <img src="/img/evo_small_3.webp" alt="Evo" />
          </div>
          <div className={s.nav}>
            {(!creatorView) &&
              <Popup key={`layout-tab-hl0`} on="hover" position="right center" arrow={false} trigger={
                <NavLink className={({isActive}) => isActive ? `${s.navLink} ${s.activeLink} ${s.colored}` : `${s.navLink} ${s.link} ${s.colored}`} to="/team/campaigns/new">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                  </svg>
                </NavLink>  
              }>
                <p className={s.navToolTip}>New Campaign</p>
              </Popup>
            }
            {(creatorView ? creatorSidebarTabs : sidebarTabs).map((tab, idx) => (
              <Popup key={`layout-tab-${idx}`} on="hover" position="right center" arrow={false} trigger={
                <NavLink className={({isActive}) => isActive ? `${s.navLink} ${s.activeLink}` : `${s.navLink} ${s.link}`} to={tab.link}>
                  {tab.icon}
                </NavLink>
              }>
                <p className={s.navToolTip}>{tab.title}</p>
              </Popup>
            ))}
          </div>
          <div className={s.mobileNav}>
            <button className={s.mobileNavTitle}>
              <span>{getPageTitle(pathname)}</span>
            </button>
            <button className={s.mobileNavButton} onClick={() => setMobileMenuOpen(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 5h16"/>
                <path d="M4 12h16"/>
                <path d="M4 19h16"/>
              </svg>
              <span>Menu</span>
            </button>
          </div>
          <div className={s.bottom}>
            <Popup key={`layout-tab-hl0`} on="hover" position="right center" arrow={false} trigger={
              <NavLink className={({isActive}) => isActive ? `${s.navLink} ${s.activeLink}` : `${s.navLink} ${s.link}`} to={(creatorView) ? "/profile" : "/settings"}>
                {(user.pfp === null) ? (
                  DEFAULT_SETTINGS_ICON
                ) : (
                  <img src={user.pfp} alt="PFP" />
                )}
              </NavLink>
            }>
              <p className={s.navToolTip}>{(creatorView) ? "Profile" : "Settings"}</p>
            </Popup>
          </div>
        </div>
        <div className={s.content}>
          {children}
          {/* Upload Indicator - Show only if there are active uploads */}
          {(uploadCount > 0) && (
            <div style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              zIndex: 1000
            }}>
              <CreativeApprovalUploadIndicator
                count={uploadCount}
                thumbnails={thumbnails}
              />
            </div>
          )}
        </div>
      </main>
    </>
  );
}

// Main Component with Provider
export default function AppLayout({ title, children }) {
  return (
    <CreativeUploadProvider>
      <AppLayoutInner title={title}>
        {children}
      </AppLayoutInner>
    </CreativeUploadProvider>
  );
}
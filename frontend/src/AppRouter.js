// Dependencies
import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Outlet,
  Navigate,
  useLocation
} from "react-router-dom";

// Context Imports
import { UsersContextProvider } from "./context/usersContextProvider.jsx";
import { useUsersContext } from "./context/useUsersContext.js";

// Util Imports
import ScrollToTop from "./utils/ScrollToTop";

// Component Imports
import NotFound404 from "./ui/ErrorCodes/404";
import AppLayout from "./ui/Layouts/AppLayout/AppLayout.jsx";
import LoadingCircle from "./ui/Components/LoadingCircle/LoadingCircle.jsx";

// API Imports
import { getAuthStatus } from "./api/auth.js";

// Pages
import {
  Login,
  Register,
  AcceptInvite, JoinInvite,
  Settings,
  // Public Pages
  PublicCampaignMetrics,
  // Client Pages
  CreatorDashboard,
  IntegrationsHome,
  CreatorCampaignHome,
  CreatorCampaignDetails,
  CreatorCampaignSubmit,
  CreatorCreativesHome,
  // Internal Pages
  InternalMetricsHome,
  InternalCreatorsHome,
  InternalCreatorDetails,
  InternalCreatorInvite,
  InternalCreatorInviteV2,
  InternalCampaignsHome,
  InternalCampaignDetails,
  InternalCampaignCreate,
  InternalCreativeApprovalHome,
  InternalMissionControlHome,
} from "./app";

// Rule-based Router
function RulesRouter({ rule }) {
  const { onChangeUser } = useUsersContext();
  const [authStatus, setAuthStatus] = useState(-1);

  // Get auth status
  async function getStatus() {
    const resp = await getAuthStatus();
    if (resp.status !== 200) {
      setAuthStatus(0);
    } else {
      const data = resp.data;
      onChangeUser({ email: data.email, ut: data.ut, dn: data.dn, pfp: data.pfp });
      setAuthStatus(1);
    }
  }
  useEffect(()=>{getStatus()},[]);

  // Return
  switch (authStatus) {
    case -1: // Loading
      return <LoadingCircle />;
    case 0: // Not logged in
      if (rule === "public") return <Outlet />;
      else return <Navigate to="/login" />;
    case 1: // Logged in
      if (rule === "private") return <Outlet />;
      else return <Navigate to="/team/dashboard" />;
    default: // Loading
      return <></>;
  }
}

// User Type Router
function UserTypeRouter({ allowedType }) {
  const { user } = useUsersContext();
  
  if (!user?.ut) {
    return <LoadingCircle />;
  }

  if (
    (user.ut === "creator" && allowedType === "creator") ||
    (user.ut === "evo" && allowedType === "evo")
  ) {
    return <Outlet />;
  }

  // Redirect based on user type
  if (user.ut === "creator") {
    // Creator-side
    return <Navigate to="/dashboard" />;

  } else if (user.ut === "evo") {
    // Internal-side
    return <Navigate to="/team/dashboard" />;
  }

  console.log("User type:", user.ut, "Allowed type:", allowedType);

  return <Navigate to="/settings" />;
}

// Functional Component
export default function App() {
  // Routing
  return (
    <UsersContextProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Only non-logged-in users */}
          <Route element={<RulesRouter rule="public" />}>
            <Route exact path="/login" element={<Login />} />
            <Route exact path="/register" element={<Register />} />
            <Route exact path="/accept-invite" element={<AcceptInvite />} />
            <Route exact path="/join-invite" element={<JoinInvite />} />
            <Route exact path="/" element={<Navigate to="/login" />} />
          </Route>

          {/* Only logged-in users */}
          <Route element={<RulesRouter rule="private" />}>
            {/* Common routes */}

            {/* Creator routes */}
            <Route element={<UserTypeRouter allowedType="creator" />}>
              <Route exact path="/dashboard" element={<AppLayout creatorView title="Dashboard"><CreatorDashboard /></AppLayout>} />
              <Route exact path="/campaigns" element={<AppLayout creatorView title="Campaigns"><CreatorCampaignHome /></AppLayout>} />
              <Route exact path="/campaigns/:campaignId" element={<AppLayout creatorView title="Campaign Details"><CreatorCampaignDetails /></AppLayout>} />
              {/* <Route exact path="/campaigns/:campaignId/submit" element={<AppLayout creatorView title="Submit Campaign"><CreatorCampaignSubmit /></AppLayout>} /> */}
              <Route exact path="/creatives" element={<AppLayout creatorView title="Creatives"><CreatorCreativesHome /></AppLayout>} />
              <Route exact path="/accounts" element={<AppLayout creatorView title="Accounts"><IntegrationsHome /></AppLayout>} />
              <Route exact path="/profile" element={<AppLayout title="Profile"><Settings /></AppLayout>} />
            </Route>

            {/* Internal routes */}
            <Route element={<UserTypeRouter allowedType="evo" />}>
              {/* <Route exact path="/team/dashboard" element={<AppLayout title="Dashboard"><InternalDashboardHome /></AppLayout>} /> */}
              {/* <Route exact path="/team/analytics" element={<AppLayout title="Analytics"><InternalMetricsHome /></AppLayout>} /> */}
              <Route exact path="/team/dashboard" element={<AppLayout title="Dashboard"><InternalMetricsHome /></AppLayout>} />
              <Route exact path="/team/campaigns" element={<AppLayout title="Campaigns"><InternalCampaignsHome /></AppLayout>} />
              <Route exact path="/team/campaigns/:campaignId/overview" element={<AppLayout title="Campaign Details"><InternalCampaignDetails /></AppLayout>} />
              <Route exact path="/team/campaigns/new" element={<AppLayout title="Create Campaign"><InternalCampaignCreate /></AppLayout>} />
              <Route exact path="/team/creators" element={<AppLayout title="Creators"><InternalCreatorsHome /></AppLayout>} />
              <Route exact path="/team/creators/:creatorId/details" element={<AppLayout title="Creator Details"><InternalCreatorDetails /></AppLayout>} />
              <Route exact path="/team/mission-control" element={<AppLayout title="Mission Control"><InternalMissionControlHome /></AppLayout>} />
              <Route exact path="/team/creative-approval" element={<AppLayout title="Creative Approval"><InternalCreativeApprovalHome /></AppLayout>} />
              <Route exact path="/team/creators/invite" element={<AppLayout title="Invite Creator"><InternalCreatorInvite /></AppLayout>} />
              <Route exact path="/team/creators/add" element={<AppLayout title="Add Creator"><InternalCreatorInviteV2 /></AppLayout>} />
              <Route exact path="/settings" element={<AppLayout title="Settings"><Settings /></AppLayout>} />
            </Route>
          </Route>

          {/* Public to everyone */}
          <Route exact path="/metrics/:shareHash" element={<PublicCampaignMetrics />} />
          <Route path="/*" element={<NotFound404 />} />
        </Routes>
      </Router>
    </UsersContextProvider>
  );
}
// Component Imports
import { InternalMetricsHome } from "../../../Internal/Metrics/Home";

// Metrics Tab Component
export default function MetricsTab({
	campaign
}) {
	return <InternalMetricsHome campaignId={campaign.id} isCreatorUser={true} />;
}

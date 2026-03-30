// Component Imports
import { InternalMetricsHome } from "../../../Metrics/Home";

// Metrics Tab Component
export default function MetricsTab({
	campaign
}) {
	return <InternalMetricsHome campaignId={campaign.id} />;
}
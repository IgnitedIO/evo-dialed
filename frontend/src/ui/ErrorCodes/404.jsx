// Dependencies
import { NavLink } from "react-router-dom";

// Style Imports
import styles from "./404.module.css";

// 404 Page
export default function NotFoundPage() {
	return (
		<div className={styles.container}>
			<div className={styles.content}>
				<h1>Oops!</h1>
				<p>We can't find that page. It might have been deleted or moved.</p>
				<NavLink to="/">Back to Dialed</NavLink>
			</div>
			<img className={styles.bgBottom} src="/img/evo_pub_bg_light.webp" alt="" />
			<img className={styles.bgTop} src="/img/evo_pub_bg_top.webp" alt="" />
		</div>
	);
}
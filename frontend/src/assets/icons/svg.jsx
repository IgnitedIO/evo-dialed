const VIEWS_ICON = (
	<svg width="800px" height="800px" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
		<path fill="currentColor" d="M512 160c320 0 512 352 512 352S832 864 512 864 0 512 0 512s192-352 512-352zm0 64c-225.28 0-384.128 208.064-436.8 288 52.608 79.872 211.456 288 436.8 288 225.28 0 384.128-208.064 436.8-288-52.608-79.872-211.456-288-436.8-288zm0 64a224 224 0 1 1 0 448 224 224 0 0 1 0-448zm0 64a160.192 160.192 0 0 0-160 160c0 88.192 71.744 160 160 160s160-71.808 160-160-71.744-160-160-160z"/>
	</svg>
)
const LIKES_ICON = (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
		<path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 4a5 5 0 0 0-5 5c0 6 9 11 9 11s9-5 9-11a5 5 0 0 0-5-5c-1.636 0-3.088 1.286-4 2.5C11.088 5.286 9.636 4 8 4Z"/>
	</svg>
);
const COMMENTS_ICON = (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
		<path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6.74v12.802c0 .375.438.59.749.369l2.006-1.428a2.88 2.88 0 0 1 1.67-.53h8.752c1.559 0 2.823-1.228 2.823-2.741V6.74C20 5.227 18.736 4 17.177 4H6.824C5.264 4 4 5.227 4 6.74Z"/>
	</svg>
);
const SHARE_ICON = (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
		<path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 9c-6.875 0-8.875 6-8.875 10 1.5-1.875 4.625-5.125 8.875-6v4l7-6-7-6v4Z"/>
	</svg>
);
const POSTS_ICON = (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
		<path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h4m0 0h4m-4 0V8m0 4v4m0 5c-1.86 0-2.789 0-3.558-.175a7 7 0 0 1-5.267-5.267C3 14.788 3 13.859 3 12c0-1.86 0-2.789.175-3.558a7 7 0 0 1 5.267-5.267C9.212 3 10.141 3 12 3c1.86 0 2.789 0 3.558.175a7 7 0 0 1 5.267 5.267C21 9.212 21 10.141 21 12c0 1.86 0 2.789-.175 3.558a7 7 0 0 1-5.267 5.267C14.788 21 13.859 21 12 21Z"/>
	</svg>
);
const RATE_ICON = (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
		<path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 5 5 19M9 7a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm10 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"/>
	</svg>
)
const CREATORS_ICON = (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
		<circle cx="9" cy="7" r="4" />
		<path d="M22 21v-2a4 4 0 0 0-3-3.87" />
		<path d="M16 3.13a4 4 0 0 1 0 7.75" />
	</svg>
);
const MONEY_ICON = (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<circle cx="12" cy="12" r="10"/>
		<path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
		<path d="M12 18V6"/>
	</svg>
);
const CAMPAIGNS_ICON = (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<line x1="22" x2="2" y1="6" y2="6"/>
		<line x1="22" x2="2" y1="18" y2="18"/>
		<line x1="6" x2="6" y1="2" y2="22"/>
		<line x1="18" x2="18" y1="2" y2="22"/>
	</svg>
);

const INSTAGRAM_ICON = (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D82E72" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
		<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
		<line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
	</svg>
);
const TIKTOK_ICON = (
	<svg fill="none" height="32" viewBox="0 0 32 32" width="32" xmlns="http://www.w3.org/2000/svg">
		<path d="m8.45095 19.7926c.15628-1.2939.68695-2.0183 1.68695-2.7609 1.4309-1.0058 3.2182-.4369 3.2182-.4369v-3.3751c.4346-.0112.8693.0146 1.299.0769v4.3435s-1.7868-.5689-3.2176.4374c-.9995.7421-1.53127 1.4671-1.687 2.761-.00488.7026.12697 1.621.7342 2.4151-.1502-.077-.3032-.1647-.4591-.2631-1.33753-.8982-1.58116-2.2456-1.57465-3.1979zm13.58425-12.81362c-.9843-1.07859-1.3566-2.16759-1.4911-2.93259h1.2382s-.2469 2.00585 1.5524 3.97843l.025.02652c-.485-.30504-.9297-.6651-1.3245-1.07236zm5.9648 3.05792v4.2561s-1.58-.0618-2.7493-.3593c-1.6328-.4161-2.6822-1.0542-2.6822-1.0542s-.7249-.455-.7835-.4867v8.7889c0 .4894-.134 1.7115-.5426 2.7308-.5334 1.3335-1.3565 2.2087-1.5079 2.3876 0 0-1.0011 1.1831-2.7673 1.9799-1.592.7187-2.9898.7005-3.4076.7187 0 0-2.4162.0957-4.59045-1.3173-.47017-.3115-.90904-.6642-1.31095-1.0537l.01086.0078c2.17477 1.413 4.59044 1.3173 4.59044 1.3173.4184-.0182 1.8161 0 3.4076-.7187 1.7646-.7967 2.7673-1.9798 2.7673-1.9798.1498-.1789.9767-1.0542 1.5079-2.3881.4075-1.0188.5426-2.2415.5426-2.7308v-8.7879c.0586.0322.783.4872.783.4872s1.05.6387 2.6827 1.0542c1.1698.2975 2.7494.3594 2.7494.3594v-3.33516c.5404.12116 1.0011.15396 1.3.12376z" fill="#ee1d52"/>
		<path d="m26.7009 9.91314v3.33406s-1.5796-.0619-2.7494-.3593c-1.6327-.4161-2.6827-1.0542-2.6827-1.0542s-.7244-.455-.783-.4873v8.79c0 .4894-.134 1.712-.5426 2.7308-.5334 1.334-1.3565 2.2092-1.5079 2.3881 0 0-1.0016 1.1831-2.7673 1.9799-1.5915.7187-2.9892.7005-3.4076.7187 0 0-2.41567.0957-4.59045-1.3173l-.01085-.0078c-.22961-.2224-.44574-.4571-.64733-.7031-.694-.8462-1.1194-1.8468-1.2263-2.1323-.00018-.0012-.00018-.0024 0-.0036-.172-.4961-.53338-1.6876-.484-2.8416.08736-2.036.8036-3.2857.99297-3.5988.50153-.8537 1.15384-1.6176 1.92789-2.2575.68305-.5523 1.45727-.9917 2.29087-1.3002.9012-.3622 1.8662-.5564 2.8433-.572v3.3751s-1.7874-.5668-3.2177.4369c-1.00001.7426-1.53068 1.467-1.68695 2.7609-.00651.9523.23712 2.2997 1.57355 3.1984.1559.0988.3089.1865.4591.2631.2334.3035.5176.568.841.7827 1.3055.8264 2.3994.8841 3.7983.3474.9327-.3588 1.6348-1.1675 1.9604-2.0636.2046-.5595.2019-1.1228.2019-1.7052v-16.56901h3.2556c.1346.765.5068 1.854 1.4911 2.93259.3948.40726.8396.76732 1.3245 1.07236.1433.14821.8758.88097 1.8161 1.33082.4862.23253.9988.41069 1.5275.53098z" fill="#000"/>
		<g fill="#69c9d0">
			<path d="m4.48926 22.7568v.0026l.08078.219c-.00928-.0255-.0393-.103-.08078-.2216z"/>
			<path d="m10.5128 13.7916c-.83361.3086-1.60782.748-2.29088 1.3002-.77429.6414-1.42644 1.4069-1.92734 2.2622-.18937.3121-.90561 1.5628-.99297 3.5988-.04938 1.154.312 2.3455.484 2.8416-.00018.0012-.00018.0024 0 .0036.10852.283.5323 1.2835 1.2263 2.1323.20159.246.41772.4808.64733.7031-.73567-.4877-1.39178-1.0772-1.94688-1.7495-.68803-.8388-1.11235-1.829-1.22304-2.1213-.00013-.0021-.00013-.0042 0-.0062v-.0037c-.17255-.4956-.53501-1.6876-.48455-2.8431.08736-2.036.80361-3.2857.99298-3.5988.50075-.8555 1.15292-1.621 1.92734-2.2622.68291-.5525 1.45716-.9919 2.29089-1.3002.52004-.2068 1.06182-.3593 1.61592-.455.835-.1397 1.6879-.1519 2.5269-.0359v.9621c-.978.0153-1.944.2095-2.846.572z"/>
			<path d="m20.5438 4.04635h-3.2557v16.56955c0 .5824 0 1.1441-.2018 1.7052-.3288.8956-1.0283 1.7042-1.9605 2.0631-1.3993.5388-2.4932.479-3.7982-.3474-.324-.2138-.6089-.4774-.8432-.7801 1.1118.5684 2.1069.5585 3.3397.0843.9317-.3589 1.6322-1.1676 1.9599-2.0636.2051-.5596.2024-1.1228.2024-1.7048v-16.5726h4.4955s-.0504.41188.0619 1.04635zm6.1564 4.94469v.92206c-.5277-.12047-1.0393-.29863-1.5247-.53097-.9403-.44985-1.6729-1.18261-1.8161-1.33083.1662.1046.3387.19976.5165.28499 1.1433.5471 2.2692.7104 2.8243.65475z"/>
		</g>
	</svg>
);

const PLUS_ICON = (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
		<path stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 12h14m-7-7v14"/>
	</svg>
);
const EDIT_ICON = (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 192 192" version="1.1">
		<path d="M 123.764 32.996 C 122.259 33.449, 119.518 34.753, 117.672 35.893 C 115.827 37.034, 95.166 57.514, 71.760 81.404 C 33.647 120.305, 29.142 125.241, 28.620 128.671 C 28.300 130.777, 27.538 137.978, 26.927 144.673 C 25.696 158.167, 26.227 160.639, 31.136 164.270 C 33.644 166.125, 34.467 166.164, 48.136 165.060 C 56.036 164.422, 63.850 163.654, 65.500 163.353 C 67.797 162.934, 78.646 152.699, 111.822 119.653 C 136.662 94.909, 156.054 74.794, 157.277 72.500 C 160.183 67.049, 160.190 57.989, 157.291 52.459 C 156.126 50.237, 151.834 45.246, 147.752 41.370 C 138.678 32.750, 132.149 30.471, 123.764 32.996 M 124.500 46.877 C 122.850 47.905, 120.271 50.057, 118.768 51.659 L 116.037 54.571 126.840 65.341 L 137.643 76.110 141.788 71.614 C 149.175 63.601, 148.791 59.997, 139.614 51.185 C 132.497 44.351, 129.791 43.579, 124.500 46.877 M 74 97.511 C 37.663 134.772, 41.243 129.634, 39.610 146.863 L 39.007 153.226 43.254 152.656 C 45.589 152.342, 50.925 151.795, 55.110 151.439 L 62.720 150.791 95.366 118.134 L 128.011 85.477 117.256 74.831 L 106.500 64.184 74 97.511" stroke="none" fill="#000000" fillRule="evenodd"/>
	</svg>
);
const TRASH_ICON = (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<path d="M3 6h18"/>
		<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
		<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
	</svg>
);
const EXTERNAL_LINK_ICON = (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
		<path stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6.343 17.657 17.657 6.343m0 0v9.9m0-9.9h-9.9"/>
	</svg>
);
const EXPORT_ICON = (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
		<path stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 5v10m0 0-4-4.148M12 15l4-4.148M4.75 18.25h14.5"/>
	</svg>
);
const CHEVRON_DOWN_ICON = (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
		<path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m6 9 6 6 6-6"/>
	</svg>
);
const CHECK_ICON = (
	<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<path d="M20 6 9 17l-5-5"/>
	</svg>
)
const SEARCH_ICON = (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<circle cx="11" cy="11" r="8"></circle>
		<path d="M21 21l-4.35-4.35"></path>
	</svg>
)
const CLOSE_ICON = (
	<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
		<line x1="18" y1="6" x2="6" y2="18"></line>
		<line x1="6" y1="6" x2="18" y2="18"></line>
	</svg>
)

export {
	VIEWS_ICON, LIKES_ICON, COMMENTS_ICON, SHARE_ICON, POSTS_ICON, RATE_ICON,
	CREATORS_ICON, MONEY_ICON, CAMPAIGNS_ICON,
	INSTAGRAM_ICON, TIKTOK_ICON,
	PLUS_ICON, EDIT_ICON, TRASH_ICON, EXTERNAL_LINK_ICON, EXPORT_ICON, CHEVRON_DOWN_ICON, CHECK_ICON,
	SEARCH_ICON, CLOSE_ICON
};
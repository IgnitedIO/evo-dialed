import s from "./LoadingCircleVariable.module.css";

export default function LoadingCircleVarSize({
    width="22px",
    height="22px",
}) {
    // Render
    return (
        <div className={s.loading_circle} style={{
            width: `${width} !important`,
            height: `${height} !important`,
        }}>
            <div className={s.loading_circle_inner} />
        </div>
    );
}
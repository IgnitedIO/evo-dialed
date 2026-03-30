import React from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./CreatorCalendar.css";

export default function CreatorCalendar({
  startDate,
  endDate,
  dailyPosts,
  frequency,
  num_posts,
  total_assigned_posts,
  onDateClick,
  creatorId,
  campaignId,
}) {
  const minDate = new Date(startDate);
  const maxDate = new Date(endDate);

  // Color days based on assigned/submitted
  function tileClassName({ date }) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();

    if (date < start || date > end) {
      return "calendar-outside";
    } else if (today < date) {
      return "calendar-grey";
    }

    const formattedDate = date.toISOString().split("T")[0];

    const matchingPost = dailyPosts.find((post) => {
      const postDate = post.date || post.created_at || post.post_date;
      if (typeof postDate === "string") {
        return postDate.startsWith(formattedDate);
      }
      return false;
    });

    const requiredPostsPerDay = num_posts;

    if (matchingPost && matchingPost.post_count >= requiredPostsPerDay) {
      return "calendar-green";
    } else {
      return "calendar-red";
    }
  }

  // Render circles for posts count
  function tileContent({ date }) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (date < start || date > end) {
      return null;
    }

    const formattedDate = date.toISOString().split("T")[0];

    const matchingPost = dailyPosts.find((post) => {
      const postDate = post.date || post.created_at || post.post_date;
      if (typeof postDate === "string") {
        return postDate.startsWith(formattedDate);
      }
      return false;
    });

    const postCount = matchingPost ? matchingPost.post_count : 0;

    // Determine color class for circles
    let colorClass = "post-circle-red";
    const today = new Date();
    if (today < date) {
      colorClass = "post-circle-grey";
    } else {
      const requiredPostsPerDay = num_posts;
      if (matchingPost && matchingPost.post_count >= requiredPostsPerDay) {
        colorClass = "post-circle-green";
      }
    }

    if (postCount === 0) {
      return null;
    }

    // For more than 4 posts
    if (postCount > 4) {
      return (
        <div className="post-circles-container">
          <div className={`post-circle ${colorClass}`}></div>
          <span className="post-circle-mult">×{postCount}</span>
        </div>
      );
    }

    // For 1-4 posts
    const circles = [];
    for (let i = 0; i < postCount; i++) {
      circles.push(<div key={i} className={`post-circle ${colorClass}`}></div>);
    }
    return <div className="post-circles-container">{circles}</div>;
  }

  // Handle date click
  const handleDateClick = (date) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (date >= start && date <= end && onDateClick) {
      const formattedDate = date.toISOString().split("T")[0];
      onDateClick(formattedDate, creatorId, campaignId);
    }
  };

  return (
    <div>
      <Calendar
        minDetail="month"
        maxDetail="month"
        minDate={minDate}
        maxDate={maxDate}
        tileClassName={tileClassName}
        tileContent={tileContent}
        onClickDay={handleDateClick}
        prevLabel={
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m15 19-7-7 7-7"/>
          </svg>
        }
        nextLabel={
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path stroke="#000" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m9 19 7-7-7-7"/>
          </svg>
        }
        prev2Label={null}
        next2Label={null}
        showNeighboringMonth={false}
        selectRange={false}
        showNavigation={true}
        value={minDate}
      />
    </div>
  );
}

import Post from "./Post";
import FollowingActivity from "./FollowingActivity";
import PostSkeleton from "../skeletons/PostSkeleton";
import { useQuery } from "@tanstack/react-query";

const Posts = ({ feedType, username }) => {
  const getPostEndpoint = () => {
    switch (feedType) {
      case "forYou":
        return "/api/posts/forYou";
      case "following":
        return "/api/posts/following-activity";
      case "posts":
        return `/api/posts/getUserPosts/${username}`;
      case "likes":
        return "/api/posts/likedposts";
      case "saved":
        return "/api/users/saved";
      default:
        return "/api/posts/getAll";
    }
  };

  const POST_ENDPOINT = getPostEndpoint();

  const {
    data: posts,
    isLoading,
    isRefetching,
  } = useQuery({
    queryKey: ["posts", feedType, username],
    queryFn: async () => {
      try {
        const res = await fetch(POST_ENDPOINT);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Something went wrong");
        }

        return data;
      } catch (error) {
        throw new Error(error);
      }
    },
  });

  return (
    <>
      {(isLoading || isRefetching) && (
        <div className="flex flex-col justify-center">
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      )}
      {!isLoading && !isRefetching && posts?.length === 0 && (
        <p className="text-center my-4">No posts in this tab. Switch 👻</p>
      )}
      {!isLoading && !isRefetching && posts && (
        <div>
          {feedType === "following" ? (
            <FollowingActivity activities={posts} />
          ) : (
            posts.map((post) => <Post key={post._id} post={post} />)
          )}
        </div>
      )}
    </>
  );
};
export default Posts;

export interface SocialCard {
    title: string;
    imageUrl: string;
    website: string;
}

export const useSocials = () => {
    const cards = ref<SocialCard[]>([
        {
            title: "Twitter",
            imageUrl: "/icon/twitter.png",
            website: "https://x.com/Rys3t_",
        },
        {
            title: "Flickr",
            imageUrl: "/icon/Flickr.png",
            website: "https://www.flickr.com/photos/195565798@N06/",
        },
        {
            title: "Instagram",
            imageUrl: "/icon/instagram.png",
            website: "https://www.instagram.com/rys3t_/",
        },
        {
            title: "Youtube",
            imageUrl: "/icon/youtube.png",
            website: "https://www.youtube.com/@Rys3t_",
        },
        {
            title: "Facebook",
            imageUrl: "/icon/facebook.png",
            website: "https://www.facebook.com/Rys3t/",
        },
        {
            title: "Github",
            imageUrl: "/icon/github.png",
            website: "https://github.com/Rys3t",
        },
        {
            title: "Steam",
            imageUrl: "/icon/steam.png",
            website: "https://steamcommunity.com/id/Rys3t_/",
        },
        {
            title: "SoundCloud",
            imageUrl: "/icon/soundcloud.png",
            website: "https://soundcloud.com/rys3t",
        },
        {
            title: "Threads",
            imageUrl: "/icon/threads.png",
            website: "https://www.threads.net/@Rys3t_",
        },
    ]);

    return {
        cards,
    };
};

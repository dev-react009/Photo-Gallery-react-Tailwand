import React, { ChangeEvent, useCallback, useEffect, useState } from "react";
import Masonry from "react-masonry-css";

interface Image {
  url: string;
  title: string;
  category: string;
}

const categories = ["All", "Nature", "City", "People"];

const breakpointColumnsObj = {
  default: 4,
  1200: 3,
  800: 2,
  500: 1,
};

const MasonryGallery: React.FC = () => {
  const [searchResults,setSearchResults] = useState<Image[]>([])
  const [images, setImages] = useState<Image[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [page, setPage] = useState(1); // Track the current page for pagination
   const [isLoading, setIsLoading] = useState<boolean>(false);
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const fallbackImage = "https://via.placeholder.com/150?text=Image+Not+Found";

  const filteredImages = images.filter(
    (image) =>
      (selectedCategory === "All" || image.category === selectedCategory) &&
      image.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleError = (
    event: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    const target = event.currentTarget as HTMLImageElement;
    target.src = fallbackImage;
    target.onerror = null;
  };

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  const moveNext = useCallback(() => {
    setCurrentImageIndex(
      (prevIndex) => (prevIndex + 1) % filteredImages.length
    );
  }, [filteredImages.length]);

  const movePrev = useCallback(() => {
    setCurrentImageIndex(
      (prevIndex) =>
        (prevIndex + filteredImages.length - 1) % filteredImages.length
    );
  }, [filteredImages.length]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isLightboxOpen) return;

      if (event.key === "ArrowRight") {
        moveNext();
      } else if (event.key === "ArrowLeft") {
        movePrev();
      } else if (event.key === "Escape") {
        closeLightbox();
      }
    },
    [isLightboxOpen, movePrev, moveNext]
  );

  // Fetch images from Unsplash API
  const fetchImages = async (page: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.unsplash.com/photos?page=${page}&per_page=10`,
        {
          method: "GET",
          headers: {
            Authorization:
              "Client-ID Aa0IftV-9E1kVPFfxkQXiq9Ho-tRYcJBVR7liS7LmfE",
          },
        }
      );
      const newImages = await response.json();
      const formattedImages: Image[] = newImages?.map(
        (img: {
          urls: { regular: string };
          description: string;
          categories: { title: string }[];
        }) => ({
          url: img?.urls?.regular,
          title: img?.description || "Untitled",
          category:
            (img.categories && img.categories.length>0 ?  img?.categories[0]?.title : "Uncategorized"),
        })
      );
      console.log(formattedImages)
      
      setImages((prevImages) => [...prevImages, ...formattedImages]);

    } catch (error) {
      console.error("Failed to fetch images:", error);
    }
    finally{
      setIsLoading(false);
    }
  };

  // Infinite scroll event listener
  const handleScroll = () => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - 100
    ) {
      setPage((prevPage) => prevPage + 1); // Load more images when user scrolls to bottom
    }
  };

  useEffect(() => {
    fetchImages(page);
  }, [page]);

  // Attach scroll event listener
  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Handle lightbox key events
  useEffect(() => {
    if (isLightboxOpen) {
      window.addEventListener("keydown", handleKeyDown);
    } else {
      window.removeEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLightboxOpen, handleKeyDown]);

  useEffect(() => { 
    if (isLightboxOpen) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }

    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, [isLightboxOpen]);

  useEffect(() => {
    const debounceFn = setTimeout(() => {
      if (searchTerm.trim() !== "") {
        setIsLoading(true);
        fetch(`https://api.unsplash.com/search/photos?page=1&query=${searchTerm}`, {
          method: "GET",
          headers: {
            Authorization:
              "Client-ID Aa0IftV-9E1kVPFfxkQXiq9Ho-tRYcJBVR7liS7LmfE",
          },
        })
          .then((response) => response.json())
          .then((res) => setSearchResults(res))
          .catch((err) =>{setIsLoading(false); console.log(err)});
      } else {
        setIsLoading(false);
        setSearchResults([]);
      }
    }, 1000);

    return ()=>clearTimeout(debounceFn);
  }, [searchTerm]);

  return (
    <div className="px-4 py-8">
      {/* Heading */}
      <h1 className="text-4xl font-bold text-center mb-8 text-gray-900 ">
        Photo Gallery
      </h1>
      {/* Filters */}
      <div className="flex flex-col md:flex-row md:justify-between items-center mb-8">
        {/* Categories */}
        <div className="flex flex-wrap justify-center mb-4 md:mb-0">
          {categories?.map((category) => (
            <button
              key={category}
              className={`m-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-blue-500 hover:text-white"
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        {/* Search */}
        <div>
          <input
            type="text"
            placeholder="Search images..."
            className="w-64 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={handleChange}
          />
        </div>
      </div>
      {/* Masonry Grid */}
      <div className="border border-gray-400 rounded-lg p-5">
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="flex w-auto -ml-4"
          columnClassName="pl-4 bg-clip-padding"
        >
          {filteredImages.length > 0 ? (
            filteredImages?.map((image, index) => (
              <div
                key={index}
                className="mb-4 cursor-pointer"
                onClick={() => openLightbox(index)}
              >
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full rounded-lg shadow-md hover:opacity-90 transition-opacity"
                  onError={handleError}
                />
                <h2 className="mt-2 text-center text-lg font-semibold text-gray-700 overflow-hidden text-ellipsis whitespace-pre-wrap">
                  {image.title.length > 100
                    ? `${image.title.substring(0, 100)}...`
                    : image.title}
                </h2>
              </div>
            ))
          ) : searchResults.length > 0 ? (
            searchResults?.map((image, index) => (
              <div
                key={index}
                className="mb-4 cursor-pointer"
                onClick={() => openLightbox(index)}
              >
                <img
                  src={image.url}
                  alt={image.title}
                  className="w-full rounded-lg shadow-md hover:opacity-90 transition-opacity"
                  onError={handleError}
                />
                <h2 className="mt-2 text-center text-lg font-semibold text-gray-700 overflow-hidden text-ellipsis whitespace-pre-wrap">
                  {image.title.length > 100
                    ? `${image.title.substring(0, 100)}...`
                    : image.title}
                </h2>
              </div>
            ))
          ) : (
            <div className=" w-auto">
              <p>No images found.</p>
            </div>
          )}
        </Masonry>
      </div>
      {/* Show loading indicator */}
      {isLoading && (
        <div className="flex justify-center items-center mt-4">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      )}
      {/* Custom Lightbox */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="relative max-w-3xl w-full mx-4">
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-2 right-2 text-white text-3xl font-bold focus:outline-none"
              aria-label="Close"
            >
              &times;
            </button>
            {/* Image */}
            <div className="w-96 h-96 flex items-center justify-center mx-auto">
              {/* Fixed width and height */}
              <img
                src={filteredImages[currentImageIndex].url}
                alt={filteredImages[currentImageIndex].title}
                className="w-full h-full object-contain rounded-lg shadow-lg"
                onError={handleError}
              />
            </div>
            {/* Title and Navigation */}
            <div className="flex justify-between items-center mt-4">
              {/* Previous Button */}
              <button
                onClick={movePrev}
                className="text-white text-3xl font-bold px-4 py-2 focus:outline-none hover:text-blue-500"
                aria-label="Previous"
              >
                &#10094;
              </button>
              {/* Title */}
              <h2 className="text-center text-white text-xl font-semibold overflow-hidden text-ellipsis whitespace-pre-wrap">
                {filteredImages[currentImageIndex].title}
              </h2>
              {/* Next Button */}
              <button
                onClick={moveNext}
                className="text-white text-3xl font-bold px-4 py-2 focus:outline-none hover:text-blue-500"
                aria-label="Next"
              >
                &#10095;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasonryGallery;

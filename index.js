import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, doc, setDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { Youtube, Twitter, Twitch, Send, Users, DollarSign, Briefcase, FileText, Info, X, Menu, UploadCloud, Link as LinkIcon, UserCircle2, Gamepad2, MessageSquare, ShieldCheck, Clock, Star, Eye } from 'lucide-react';

// --- Firebase Configuration ---
// Updated to use user-provided config as fallback
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "AIzaSyARRfoFdEjk8OMYZNIQXjbw0kGFmmH9Irs",
  authDomain: "wick-roblox.firebaseapp.com",
  projectId: "wick-roblox",
  storageBucket: "wick-roblox.firebasestorage.app", // Corrected based on user input
  messagingSenderId: "1080225162098",
  appId: "1:1080225162098:web:00b186e0c6975ad6c7b3eb",
  measurementId: "G-HKV1VPVJKM" // Added measurementId from user config
};

const appId = typeof __app_id !== 'undefined' ? __app_id : 'wick-marketplace-default'; // This appId is for Firestore path construction

// --- Main App Component ---
const App = () => {
    const [currentPage, setCurrentPage] = useState('home');
    const [creators, setCreators] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const [selectedCreatorForContact, setSelectedCreatorForContact] = useState(null);

    // Firebase state
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        console.log("WickApp: currentPage changed to:", currentPage);
    }, [currentPage]);
    
    useEffect(() => {
        console.log(`WickApp: isAuthReady changed to: ${isAuthReady}, currentUser: ${currentUser ? currentUser.uid : null}`);
    }, [isAuthReady, currentUser]);

    // Initialize Firebase and Auth
    useEffect(() => {
        console.log("WickApp: Firebase init effect running with config:", firebaseConfig); // Log the config being used
        let unsubscribeAuth;
        try {
            const app = initializeApp(firebaseConfig); // Uses the updated firebaseConfig
            const firestoreDb = getFirestore(app);
            const firebaseAuth = getAuth(app);
            setDb(firestoreDb);
            setAuth(firebaseAuth);
            console.log("WickApp: Firebase app, db, auth instances set.");

            unsubscribeAuth = onAuthStateChanged(firebaseAuth, async (user) => {
                console.log("WickApp: onAuthStateChanged triggered. User:", user ? user.uid : null);
                if (user) {
                    console.log("WickApp: User is signed in:", user.uid);
                    setCurrentUser(user);
                    setUserId(user.uid);
                    if (!isAuthReady) setIsAuthReady(true);
                } else {
                    console.log("WickApp: No user from onAuthStateChanged. Attempting custom/anonymous sign-in.");
                    setCurrentUser(null); 
                    setUserId(null);
                    try {
                        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                            console.log("WickApp: Attempting signInWithCustomToken.");
                            await signInWithCustomToken(firebaseAuth, __initial_auth_token);
                            console.log("WickApp: signInWithCustomToken call completed.");
                        } else {
                            console.log("WickApp: Attempting signInAnonymously.");
                            await signInAnonymously(firebaseAuth);
                            console.log("WickApp: signInAnonymously call completed.");
                        }
                    } catch (error) {
                        console.error("WickApp: Error during custom/anonymous sign-in:", error);
                        setCurrentUser(null);
                        setUserId(null);
                        if (!isAuthReady) setIsAuthReady(true); 
                    }
                }
            });
        } catch (error) {
            console.error("WickApp: Firebase initialization error:", error);
            setIsLoading(false); 
            if (!isAuthReady) setIsAuthReady(true); 
        }
        return () => {
            if (unsubscribeAuth) {
                console.log("WickApp: Cleaning up onAuthStateChanged listener.");
                unsubscribeAuth();
            }
        };
    }, []); 

    // Fetch creators from Firestore
    useEffect(() => {
        console.log(`WickApp: Creator fetching effect. db: ${!!db}, isAuthReady: ${isAuthReady}, appId: ${appId}`);
        if (db && isAuthReady) { 
            setIsLoading(true); 
            console.log("WickApp: Auth is ready and DB is available. Fetching APPROVED creators from Firestore.");
            const creatorsCollectionPath = `artifacts/${appId}/public/data/creators`;
            const q = query(collection(db, creatorsCollectionPath), where("status", "==", "approved"));

            const unsubscribeSnapshot = onSnapshot(q, (querySnapshot) => {
                console.log("WickApp: Approved creators snapshot received. Processing...");
                const creatorsData = [];
                querySnapshot.forEach((doc) => {
                    creatorsData.push({ id: doc.id, ...doc.data() });
                });
                setCreators(creatorsData);
                setIsLoading(false);
                console.log("WickApp: Creators state updated with", creatorsData.length, "approved creators. isLoading set to false.");
            }, (error) => {
                console.error("WickApp: Error fetching approved creators:", error);
                setIsLoading(false); 
            });

            return () => {
                console.log("WickApp: Cleaning up approved creators snapshot listener.");
                unsubscribeSnapshot(); 
            };
        } else {
            console.log("WickApp: Not fetching creators - db not initialized or auth not ready.");
            if (!isAuthReady) {
                console.log("WickApp: Auth not ready, setting isLoading to true.");
                setIsLoading(true); 
            } else {
                 console.log("WickApp: Auth is ready but DB might not be. Setting isLoading to false.");
                setIsLoading(false);
            }
        }
    }, [db, isAuthReady, appId]); 


    const navigate = (page) => {
        console.log(`WickApp: Navigating to ${page}`);
        setCurrentPage(page);
        setShowMobileMenu(false); 
        window.scrollTo(0, 0); 
    };

    const openContactModal = (creator) => {
        setSelectedCreatorForContact(creator);
        setShowContactModal(true);
    };

    const closeContactModal = () => {
        setShowContactModal(false);
        setSelectedCreatorForContact(null);
    };

    // --- UI Components ---

    const Navbar = () => (
        <nav className="bg-gray-900 text-white sticky top-0 z-50 shadow-lg">
            <div className="container mx-auto px-6 py-3 flex justify-between items-center">
                <a href="#" onClick={(e) => { e.preventDefault(); navigate('home');}} className="text-2xl font-bold text-red-500 hover:text-red-400 transition-colors">
                    wick
                </a>
                <div className="hidden md:flex space-x-4 items-center">
                    <NavLink href="home">Home</NavLink>
                    <NavLink href="creator-directory">Browse Creators</NavLink>
                    <NavLink href="submit-listing">List Yourself</NavLink>
                    <NavLink href="how-it-works">How It Works</NavLink>
                    <NavLink href="terms-privacy">Terms & Privacy</NavLink>
                    {userId && <span className="text-xs text-gray-500">UID: {userId.substring(0,8)}...</span>}
                </div>
                <div className="md:hidden">
                    <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="text-white focus:outline-none">
                        {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>
            {showMobileMenu && (
                <div className="md:hidden bg-gray-800">
                    <NavLink href="home" mobile>Home</NavLink>
                    <NavLink href="creator-directory" mobile>Browse Creators</NavLink>
                    <NavLink href="submit-listing" mobile>List Yourself</NavLink>
                    <NavLink href="how-it-works" mobile>How It Works</NavLink>
                    <NavLink href="terms-privacy" mobile>Terms & Privacy</NavLink>
                    {userId && <span className="block px-4 py-2 text-xs text-gray-500">UID: {userId}</span>}
                </div>
            )}
        </nav>
    );

    const NavLink = ({ href, children, mobile = false }) => (
        <a
            href="#"
            onClick={(e) => { e.preventDefault(); navigate(href);}}
            className={`font-medium transition-colors ${
                mobile 
                ? 'block px-4 py-3 text-sm hover:bg-gray-700' 
                : 'px-3 py-2 rounded-md hover:bg-red-500 hover:text-gray-900'
            } ${currentPage === href ? (mobile ? 'bg-red-600 text-white' : 'bg-red-500 text-gray-900') : 'text-gray-300'}`}
        >
            {children}
        </a>
    );

    // HomePage Component
    const HomePage = ({ creators: allCreators, isLoading: isLoadingCreators, navigate }) => {
        const [featuredCreators, setFeaturedCreators] = useState([]);
        const MAX_FEATURED = 3;

        useEffect(() => {
            if (!isLoadingCreators && allCreators && allCreators.length > 0) {
                const shuffled = [...allCreators].sort(() => 0.5 - Math.random());
                setFeaturedCreators(shuffled.slice(0, MAX_FEATURED));
            } else {
                setFeaturedCreators([]); // Clear if loading or no creators
            }
        }, [allCreators, isLoadingCreators]);

        return (
            <div className="bg-gray-900 text-white">
                {/* Hero Section */}
                <header className="min-h-screen flex flex-col items-center justify-center text-center px-4 py-10 bg-gray-900">
                    <div className="container mx-auto">
                        <h1 className="text-5xl md:text-7xl font-bold mb-4 animate-fade-in-down" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                            Promote Your <span className="text-red-500">Roblox</span> Game
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-300 mb-8 animate-fade-in-up">
                            Find trusted creators to shout out your game for Robux.
                        </p>
                        <div className="space-y-4 md:space-y-0 md:space-x-6 animate-fade-in-up animation-delay-500">
                            <button
                                onClick={() => navigate('creator-directory')}
                                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-all text-lg"
                            >
                                <Users className="inline-block mr-2" size={20}/> Browse Creators
                            </button>
                            <button
                                onClick={() => navigate('submit-listing')}
                                className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-all text-lg"
                            >
                               <UploadCloud className="inline-block mr-2" size={20}/> List Yourself
                            </button>
                        </div>
                    </div>
                </header>

                {/* Featured Creators Section */}
                {!isLoadingCreators && featuredCreators.length > 0 && (
                    <section className="py-16 bg-gray-850"> {/* Slightly different bg for section distinction */}
                        <div className="container mx-auto px-6 text-center">
                            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-red-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                                <Star className="inline-block mr-3 mb-1 text-yellow-400" size={30}/>
                                Check These Creators Out!
                                <Star className="inline-block ml-3 mb-1 text-yellow-400" size={30}/>
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {featuredCreators.map(creator => (
                                    <FeaturedCreatorCard key={creator.id} creator={creator} navigate={navigate} />
                                ))}
                            </div>
                             <button
                                onClick={() => navigate('creator-directory')}
                                className="mt-12 bg-transparent hover:bg-red-600 text-red-500 font-semibold hover:text-white py-3 px-8 border border-red-500 hover:border-transparent rounded-lg transition-all text-lg"
                            >
                                <Eye className="inline-block mr-2" size={20}/> View All Creators
                            </button>
                        </div>
                    </section>
                )}

                {/* Why Choose Wick Section */}
                <section className="py-16 bg-gray-900">
                    <div className="container mx-auto px-6">
                        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-red-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>Why Choose Wick?</h2>
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
                                <h3 className="text-2xl font-semibold mb-3 text-red-300">For Game Developers</h3>
                                <ul className="space-y-2 text-gray-300 list-disc list-inside">
                                    <li><span className="font-semibold text-red-400">Targeted Reach:</span> Connect directly with Roblox content creators.</li>
                                    <li><span className="font-semibold text-red-400">Verified Listings:</span> All creators are manually approved for quality.</li>
                                    <li><span className="font-semibold text-red-400">Simple Payments:</span> Transact securely with Robux via Game Passes.</li>
                                    <li><span className="font-semibold text-red-400">Boost Visibility:</span> Get your game in front of engaged audiences.</li>
                                </ul>
                            </div>
                            <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
                                <h3 className="text-2xl font-semibold mb-3 text-red-300">For Content Creators</h3>
                                <ul className="space-y-2 text-gray-300 list-disc list-inside">
                                    <li><span className="font-semibold text-red-400">Monetize Your Content:</span> Earn Robux promoting new games.</li>
                                    <li><span className="font-semibold text-red-400">Fair Commission:</span> Clear and transparent payment structure.</li>
                                    <li><span className="font-semibold text-red-400">Showcase Your Brand:</span> Get discovered by game developers.</li>
                                    <li><span className="font-semibold text-red-400">Easy Listing:</span> Simple form to get your profile live (after approval).</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                 {/* How It Works Summary Section */}
                <section className="py-16 bg-gray-850">
                    <div className="container mx-auto px-6 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-red-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>Get Started in 3 Easy Steps</h2>
                        <div className="grid md:grid-cols-3 gap-8 text-left">
                            <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
                                <div className="flex items-center mb-3">
                                    <div className="bg-red-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-xl mr-4">1</div>
                                    <h3 className="text-xl font-semibold text-red-300">Browse or List</h3>
                                </div>
                                <p className="text-gray-400">Game Developers: Find the perfect creator. <br/> Creators: Submit your profile for approval.</p>
                            </div>
                            <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
                                <div className="flex items-center mb-3">
                                    <div className="bg-red-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-xl mr-4">2</div>
                                    <h3 className="text-xl font-semibold text-red-300">Connect & Agree</h3>
                                </div>
                                <p className="text-gray-400">Use the contact form to discuss terms. All payments are made via Robux (Game Pass/Dev Product).</p>
                            </div>
                            <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
                                <div className="flex items-center mb-3">
                                    <div className="bg-red-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-xl mr-4">3</div>
                                    <h3 className="text-xl font-semibold text-red-300">Promote & Grow</h3>
                                </div>
                                <p className="text-gray-400">Creator promotes the game. Developer sees increased visibility! Review our <a href="#" onClick={(e) => {e.preventDefault(); navigate('how-it-works')}} className="text-red-400 hover:underline">commission structure</a>.</p>
                            </div>
                        </div>
                         <button
                            onClick={() => navigate('how-it-works')}
                            className="mt-12 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-all text-lg"
                        >
                            Learn More Details
                        </button>
                    </div>
                </section>
            </div>
        );
    };

    // Featured Creator Card (Simplified for Homepage)
    const FeaturedCreatorCard = ({ creator, navigate }) => (
        <div className="bg-gray-800 rounded-xl shadow-xl p-6 transform hover:scale-105 transition-transform duration-300 flex flex-col items-center text-center">
            <img
                src={creator.avatarUrl || `https://placehold.co/100x100/2D3748/E2E8F0?text=${creator.robloxUsername.charAt(0)}`}
                alt={`${creator.robloxUsername}'s avatar`}
                className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-gray-700 object-cover"
                onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/100x100/2D3748/E2E8F0?text=${creator.robloxUsername.charAt(0)}`; }}
            />
            <h3 className="text-xl font-semibold text-red-400 mb-1">{creator.robloxUsername}</h3>
            <p className="text-lg font-bold text-green-400 mb-2">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Robux_2019_Logo_gold.svg/2048px-Robux_2019_Logo_gold.svg.png" alt="Robux" className="inline-block w-5 h-5 mr-1" />
                {creator.priceRobux}
            </p>
            <p className="text-gray-400 text-xs mb-3 h-12 overflow-hidden">{creator.bio.substring(0, 70)}{creator.bio.length > 70 ? '...' : ''}</p>
            <button
                onClick={() => navigate('creator-directory')} // Or navigate to a specific creator's detail page if you build one
                className="mt-auto w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
            >
                View Profile
            </button>
        </div>
    );


    const CreatorCard = ({ creator }) => (
        <div className="bg-gray-800 rounded-xl shadow-2xl p-6 flex flex-col justify-between hover:shadow-red-500/30 transition-shadow duration-300">
            <div>
                <div className="relative">
                    <img 
                        src={creator.avatarUrl || `https://placehold.co/150x150/2D3748/E2E8F0?text=${creator.robloxUsername.charAt(0)}`} 
                        alt={`${creator.robloxUsername}'s avatar`} 
                        className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-gray-700 object-cover"
                        onError={(e) => { e.target.onerror = null; e.target.src=`https://placehold.co/150x150/2D3748/E2E8F0?text=${creator.robloxUsername.charAt(0)}`; }}
                    />
                </div>
                <h3 className="text-xl font-semibold text-center text-red-400 mb-1">{creator.robloxUsername}</h3>
                <p className="text-center text-2xl font-bold text-green-400 mb-3">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Robux_2019_Logo_gold.svg/2048px-Robux_2019_Logo_gold.svg.png" alt="Robux" className="inline-block w-6 h-6 mr-1" />
                    {creator.priceRobux}
                </p>
                <p className="text-gray-400 text-sm mb-4 h-20 overflow-y-auto custom-scrollbar">{creator.bio}</p>
                <div className="mb-4 space-y-2">
                    {creator.platformLinks && creator.platformLinks.map((link, index) => (
                        <a
                            key={index}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-sm text-blue-400 hover:text-blue-300 transition-colors bg-gray-700 px-3 py-2 rounded-md"
                        >
                            {link.platform.toLowerCase() === 'youtube' && <Youtube size={18} className="mr-2" />}
                            {link.platform.toLowerCase() === 'twitter' && <Twitter size={18} className="mr-2" />}
                            {link.platform.toLowerCase() === 'twitch' && <Twitch size={18} className="mr-2" />}
                            {link.platform.toLowerCase() !== 'youtube' && link.platform.toLowerCase() !== 'twitter' && link.platform.toLowerCase() !== 'twitch' && <LinkIcon size={18} className="mr-2" />}
                            {link.platform} Profile
                        </a>
                    ))}
                </div>
            </div>
            <button
                onClick={() => openContactModal(creator)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors mt-2"
            >
                <Send className="inline-block mr-2" size={16}/> Contact Creator
            </button>
             {creator.userId && <p className="text-xs text-gray-600 mt-2 text-center">Creator ID: {creator.userId.substring(0,6)}...</p>}
        </div>
    );

    const CreatorDirectoryPage = () => (
        <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
            <div className="container mx-auto">
                <h2 className="text-4xl font-bold mb-2 text-center text-red-500" style={{ fontFamily: 'Orbitron, sans-serif' }}>Creator Directory</h2>
                <p className="text-center text-gray-400 mb-8 text-sm flex items-center justify-center">
                    <ShieldCheck size={16} className="mr-2 text-green-400"/> All listings are manually approved.
                </p>
                {isLoading && <p className="text-center text-xl py-10">Loading approved creators... Please wait.</p>}
                {!isLoading && creators.length === 0 && (
                    <div className="text-center py-10">
                        <UserCircle2 size={64} className="mx-auto text-gray-500 mb-4" />
                        <p className="text-xl text-gray-400">No approved creators listed yet.</p>
                        <p className="text-gray-500">Check back soon, or <a href="#" onClick={(e) => {e.preventDefault(); navigate('submit-listing')}} className="text-red-400 hover:underline">list yourself</a> for approval!</p>
                    </div>
                )}
                {!isLoading && creators.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {creators.map((creator) => (
                            <CreatorCard key={creator.id} creator={creator} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
    
    const SubmitListingPage = () => {
        const [formData, setFormData] = useState({
            robloxUsername: '',
            priceRobux: '',
            platformLinks: [{ platform: 'YouTube', url: '' }],
            bio: '',
            avatarUrl: '',
            contactEmailOrDiscord: ''
        });
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });

        const handleChange = (e) => {
            const { name, value } = e.target;
            setFormData(prev => ({ ...prev, [name]: value }));
        };

        const handlePlatformLinkChange = (index, field, value) => {
            const newLinks = [...formData.platformLinks];
            newLinks[index][field] = value;
            setFormData(prev => ({ ...prev, platformLinks: newLinks }));
        };

        const addPlatformLink = () => {
            setFormData(prev => ({
                ...prev,
                platformLinks: [...prev.platformLinks, { platform: 'YouTube', url: '' }]
            }));
        };

        const removePlatformLink = (index) => {
            const newLinks = formData.platformLinks.filter((_, i) => i !== index);
            setFormData(prev => ({ ...prev, platformLinks: newLinks }));
        };
        
        const handleSubmit = async (e) => {
            e.preventDefault();
            console.log("WickApp: SubmitListingPage handleSubmit called.");
            if (!db || !userId) {
                console.error("WickApp: SubmitListingPage - Firestore db not available or user not authenticated.");
                setSubmitMessage({ type: 'error', text: 'Error: Database not ready or user not authenticated. Please refresh and try again.' });
                return;
            }
            setIsSubmitting(true);
            setSubmitMessage({ type: '', text: '' });

            try {
                const creatorsCollectionPath = `artifacts/${appId}/public/data/creators`;
                console.log("WickApp: SubmitListingPage - Adding document to Firestore with 'pending_approval' status:", formData, "by userId:", userId);
                await addDoc(collection(db, creatorsCollectionPath), {
                    ...formData,
                    priceRobux: parseInt(formData.priceRobux, 10) || 0,
                    userId: userId, 
                    status: "pending_approval", 
                    createdAt: serverTimestamp()
                });
                console.log("WickApp: SubmitListingPage - Listing submitted for approval.");
                setSubmitMessage({ type: 'success', text: 'Listing submitted successfully! It is now pending review and will appear in the directory once approved.' });
                setFormData({ 
                    robloxUsername: '', priceRobux: '', platformLinks: [{ platform: 'YouTube', url: '' }], bio: '', avatarUrl: '', contactEmailOrDiscord: ''
                });
            } catch (error) {
                console.error("WickApp: SubmitListingPage - Error submitting listing:", error);
                setSubmitMessage({ type: 'error', text: `Failed to submit listing: ${error.message}` });
            } finally {
                setIsSubmitting(false);
            }
        };


        return (
            <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
                <div className="container mx-auto max-w-2xl">
                    <h2 className="text-4xl font-bold mb-8 text-center text-red-500" style={{ fontFamily: 'Orbitron, sans-serif' }}>List Yourself as a Creator</h2>
                    
                    <div className="bg-yellow-900 border-l-4 border-yellow-500 text-yellow-100 p-4 mb-6 rounded-md" role="alert">
                        <div className="flex">
                            <div className="py-1"><Clock size={20} className="mr-3 text-yellow-400"/></div>
                            <div>
                                <p className="font-bold">Listing Approval Required</p>
                                <p className="text-sm">All new listings are manually reviewed before they appear in the directory. This may take some time.</p>
                            </div>
                        </div>
                    </div>

                    {submitMessage.text && (
                        <div className={`p-4 mb-4 rounded-md text-center ${submitMessage.type === 'success' ? 'bg-green-700 text-green-100' : 'bg-red-700 text-red-100'}`}>
                            {submitMessage.text}
                        </div>
                    )}
                    {!isAuthReady && (
                         <div className="p-4 mb-4 rounded-md text-center bg-yellow-600">
                            Authenticating... Please wait before submitting.
                        </div>
                    )}
                     {isAuthReady && !userId && (
                         <div className="p-4 mb-4 rounded-md text-center bg-yellow-700">
                            Authenticated anonymously. Your listing will be associated with a temporary ID. Please ensure your contact details are correct for approval communication.
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-2xl space-y-6">
                        <div>
                            <label htmlFor="robloxUsername" className="block text-sm font-medium text-gray-300 mb-1">Roblox Username</label>
                            <input type="text" name="robloxUsername" id="robloxUsername" value={formData.robloxUsername} onChange={handleChange} required className="w-full bg-gray-700 border-gray-600 text-white rounded-lg p-3 focus:ring-red-500 focus:border-red-500" />
                        </div>
                        <div>
                            <label htmlFor="avatarUrl" className="block text-sm font-medium text-gray-300 mb-1">Avatar Image URL (optional)</label>
                            <input type="url" name="avatarUrl" id="avatarUrl" value={formData.avatarUrl} onChange={handleChange} placeholder="https://your-roblox-avatar-image.png" className="w-full bg-gray-700 border-gray-600 text-white rounded-lg p-3 focus:ring-red-500 focus:border-red-500" />
                            <p className="text-xs text-gray-500 mt-1">Link to your Roblox avatar image or any public image URL.</p>
                        </div>
                        <div>
                            <label htmlFor="priceRobux" className="block text-sm font-medium text-gray-300 mb-1">Price per Video (in Robux)</label>
                            <input type="number" name="priceRobux" id="priceRobux" value={formData.priceRobux} onChange={handleChange} required min="0" className="w-full bg-gray-700 border-gray-600 text-white rounded-lg p-3 focus:ring-red-500 focus:border-red-500" />
                        </div>
                        <div>
                            <label htmlFor="contactEmailOrDiscord" className="block text-sm font-medium text-gray-300 mb-1">Your Contact Info (Email or Discord for approval communication)</label>
                            <input type="text" name="contactEmailOrDiscord" id="contactEmailOrDiscord" value={formData.contactEmailOrDiscord} onChange={handleChange} required placeholder="yourname@example.com or YourDiscord#1234" className="w-full bg-gray-700 border-gray-600 text-white rounded-lg p-3 focus:ring-red-500 focus:border-red-500" />
                        </div>
                        <div>
                            <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-1">Short Bio (max 200 characters)</label>
                            <textarea name="bio" id="bio" value={formData.bio} onChange={handleChange} rows="3" maxLength="200" required className="w-full bg-gray-700 border-gray-600 text-white rounded-lg p-3 focus:ring-red-500 focus:border-red-500 custom-scrollbar"></textarea>
                        </div>

                        <fieldset className="space-y-3">
                            <legend className="text-sm font-medium text-gray-300 mb-1">Platform Links</legend>
                            {formData.platformLinks.map((link, index) => (
                                <div key={index} className="flex items-center space-x-2 p-3 bg-gray-700 rounded-md">
                                    <select
                                        value={link.platform}
                                        onChange={(e) => handlePlatformLinkChange(index, 'platform', e.target.value)}
                                        className="bg-gray-600 border-gray-500 text-white rounded-lg p-3 focus:ring-red-500 focus:border-red-500 w-1/3"
                                    >
                                        <option>YouTube</option>
                                        <option>TikTok</option>
                                        <option>Twitter</option>
                                        <option>Twitch</option>
                                        <option>Other</option>
                                    </select>
                                    <input
                                        type="url"
                                        placeholder="https://platform.com/yourprofile"
                                        value={link.url}
                                        onChange={(e) => handlePlatformLinkChange(index, 'url', e.target.value)}
                                        required
                                        className="w-2/3 bg-gray-600 border-gray-500 text-white rounded-lg p-3 focus:ring-red-500 focus:border-red-500"
                                    />
                                    {formData.platformLinks.length > 1 && (
                                        <button type="button" onClick={() => removePlatformLink(index)} className="text-red-500 hover:text-red-400 p-1">
                                            <X size={20} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button type="button" onClick={addPlatformLink} className="text-sm text-red-400 hover:text-red-300 py-2 px-3 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors">
                                + Add Another Platform
                            </button>
                        </fieldset>

                        <button 
                            type="submit" 
                            disabled={isSubmitting || !isAuthReady || !userId} 
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Submitting for Review...' : (isAuthReady && userId ? 'Submit for Review' : 'Authenticating...')}
                        </button>
                    </form>
                </div>
            </div>
        );
    };

    const HowItWorksPage = () => (
        <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
            <div className="container mx-auto max-w-3xl">
                <h2 className="text-4xl font-bold mb-8 text-center text-red-500" style={{ fontFamily: 'Orbitron, sans-serif' }}>How It Works</h2>
                
                <div className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-2xl space-y-6 mb-8">
                    <p className="text-lg text-gray-300">
                        Our platform connects Roblox game developers with content creators for promotional opportunities. All payments are handled via Robux through Roblox's official systems (Game Passes or Developer Products). Here's how the payment distribution works:
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-start space-x-4">
                            <div className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0 mt-1">1</div>
                            <div>
                                <h3 className="font-semibold text-xl text-red-400">Advertiser Pays</h3>
                                <p className="text-gray-400">A game developer (advertiser) agrees on a price with a creator and pays the agreed amount in Robux using a Game Pass or Developer Product provided by the creator.</p>
                                <p className="text-gray-500 text-sm">Example: Advertiser pays 1,000 Robux.</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <div className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0 mt-1">2</div>
                            <div>
                                <h3 className="font-semibold text-xl text-red-400">Roblox's Cut</h3>
                                <p className="text-gray-400">Roblox takes its standard 30% transaction fee from the amount paid.</p>
                                <p className="text-gray-500 text-sm">Example: 1,000 Robux * 30% = 300 Robux (to Roblox). Remaining: 700 Robux.</p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-4">
                            <div className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0 mt-1">3</div>
                            <div>
                                <h3 className="font-semibold text-xl text-red-400">Platform Commission (wick)</h3>
                                <p className="text-gray-400">"wick" (this platform) takes a 10% commission from the amount remaining *after* Roblox's cut.</p>
                                <p className="text-gray-500 text-sm">Example: 700 Robux * 10% = 70 Robux (to wick).</p>
                            </div>
                        </div>
                        
                        <div className="flex items-start space-x-4">
                            <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0 mt-1">4</div>
                            <div>
                                <h3 className="font-semibold text-xl text-green-400">Creator Receives</h3>
                                <p className="text-gray-400">The creator receives the final amount after Roblox's cut and our platform's commission.</p>
                                <p className="text-gray-500 text-sm">Example: 700 Robux - 70 Robux = 630 Robux (to Creator).</p>
                                <p className="text-gray-300 text-md mt-2">This means the creator effectively receives 63% of the original amount paid by the advertiser (90% of the 70% that remains after Roblox's cut).</p>
                            </div>
                        </div>
                    </div>
                     <div className="mt-6 pt-4 border-t border-gray-700">
                        <h3 className="font-semibold text-xl text-red-400 mb-2 flex items-center"><Clock size={20} className="mr-2"/> Listing Approvals</h3>
                        <p className="text-gray-400">To maintain quality and safety, all creator listings submitted to "wick" are manually reviewed by our team before they become visible in the Creator Directory. We appreciate your patience during this process.</p>
                    </div>
                </div>

                <h3 className="text-2xl font-semibold mb-4 text-center text-red-400">Visual Flowchart (Payment)</h3>
                <div className="bg-gray-800 p-6 rounded-xl shadow-xl text-center">
                    <div className="flex flex-col md:flex-row justify-around items-center space-y-4 md:space-y-0 md:space-x-4">
                        <div className="flex flex-col items-center p-3 bg-gray-700 rounded-lg w-full md:w-1/4">
                            <DollarSign size={32} className="text-blue-400 mb-2"/>
                            <p className="font-semibold">Advertiser Pays</p>
                            <p className="text-sm text-gray-400">100% (e.g. 1000 R$)</p>
                        </div>
                        <div className="text-2xl text-red-500 transform md:rotate-0 rotate-90">&rarr;</div>
                        <div className="flex flex-col items-center p-3 bg-gray-700 rounded-lg w-full md:w-1/4">
                            <Gamepad2 size={32} className="text-gray-400 mb-2"/>
                            <p className="font-semibold">Roblox Cut (30%)</p>
                            <p className="text-sm text-gray-400">70% remains (e.g. 700 R$)</p>
                        </div>
                        <div className="text-2xl text-red-500 transform md:rotate-0 rotate-90">&rarr;</div>
                        <div className="flex flex-col items-center p-3 bg-gray-700 rounded-lg w-full md:w-1/4">
                            <Briefcase size={32} className="text-red-400 mb-2"/>
                            <p className="font-semibold">"wick" Cut (10% of remainder)</p>
                            <p className="text-sm text-gray-400">7% of original (e.g. 70 R$)</p>
                        </div>
                         <div className="text-2xl text-red-500 transform md:rotate-0 rotate-90">&rarr;</div>
                        <div className="flex flex-col items-center p-3 bg-green-600 rounded-lg w-full md:w-1/4">
                            <UserCircle2 size={32} className="text-white mb-2"/>
                            <p className="font-semibold">Creator Gets</p>
                            <p className="text-sm text-gray-200">63% of original (e.g. 630 R$)</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const TermsPrivacyPage = () => (
        <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
            <div className="container mx-auto max-w-3xl">
                <h2 className="text-4xl font-bold mb-8 text-center text-red-500" style={{ fontFamily: 'Orbitron, sans-serif' }}>Terms of Service & Privacy Policy</h2>
                
                <div className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-2xl space-y-6">
                    <section className="mb-6">
                        <h3 className="text-2xl font-semibold text-red-400 mb-3">Terms of Service</h3>
                        <p className="text-gray-300 mb-2">Welcome to "wick"! By using our platform, you agree to these terms.</p>
                        <ul className="list-disc list-inside text-gray-400 space-y-1 pl-4">
                            <li>"wick" is a marketplace to connect Roblox game developers with content creators. We are not a party to any agreements made between users.</li>
                            <li>All Robux transactions for promotions must be conducted through Roblox's official mechanisms (e.g., Game Passes, Developer Products). "wick" does not handle Robux directly.</li>
                            <li>Users are solely responsible for the arrangements they make, the content produced, and ensuring compliance with Roblox's Terms of Service.</li>
                            <li>**Listing Approval:** All creator listings are subject to manual review and approval by the "wick" platform administrators before they are made public. We reserve the right to approve or reject any listing at our sole discretion, without providing a reason.</li>
                            <li>We reserve the right to remove listings or suspend access for users who violate these terms or engage in fraudulent activities.</li>
                            <li>The platform ("wick") earns a 10% commission on the Robux amount that the platform owner (you) receives *after* Roblox has taken its 30% transaction fee. This means the platform's commission is effectively 7% of the original transaction value.</li>
                        </ul>
                    </section>

                    <section className="mb-6">
                        <h3 className="text-2xl font-semibold text-red-400 mb-3">Privacy Policy</h3>
                        <p className="text-gray-300 mb-2">We value your privacy. This policy outlines how we handle your information.</p>
                        <ul className="list-disc list-inside text-gray-400 space-y-1 pl-4">
                            <li>Information We Collect: When you submit a listing, we collect your Roblox username, pricing, platform links, bio, avatar URL (optional), contact information (email/Discord), and listing status (e.g., pending, approved). Your Firebase User ID is also associated with your listing.</li>
                            <li>How We Use Information: To display your listing on the Creator Directory (if approved), to review your listing for approval, to allow advertisers to contact you, and for platform operation. Your contact information may be used to communicate with you regarding your listing status.</li>
                            <li>Data Storage: Listing data is stored securely using Firebase Firestore.</li>
                            <li>Third-Party Links: Our site may link to third-party platforms (YouTube, TikTok, etc.). We are not responsible for their privacy practices.</li>
                            <li>Data Sharing: We do not sell your personal information. Public listing information for approved listings is visible on the directory.</li>
                            <li>Your Choices: You can request removal of your listing by contacting us.</li>
                        </ul>
                    </section>
                    
                    <section>
                        <h3 className="text-2xl font-semibold text-red-400 mb-3">Disclaimers</h3>
                        <ul className="list-disc list-inside text-gray-400 space-y-1 pl-4">
                            <li>"wick" is not affiliated with Roblox Corporation.</li>
                            <li>All financial transactions involving Robux are subject to Roblox's terms and conditions.</li>
                            <li>We are not responsible for disputes between advertisers and creators. We encourage clear communication and agreements.</li>
                        </ul>
                    </section>
                </div>
            </div>
        </div>
    );

    const ContactCreatorModal = () => {
        const [contactData, setContactData] = useState({
            name: '',
            robloxUsername: '',
            budget: '',
            gameLink: '',
            message: '',
            contactInfo: '' 
        });
        const [isSending, setIsSending] = useState(false);
        const [sendStatus, setSendStatus] = useState({ type: '', text: '' });

        const handleChange = (e) => {
            setContactData({ ...contactData, [e.target.name]: e.target.value });
        };

        const handleSubmit = async (e) => {
            e.preventDefault();
            setIsSending(true);
            setSendStatus({ type: '', text: '' });
            console.log("WickApp: Contact Form Data for", selectedCreatorForContact?.robloxUsername, ":", contactData);
            
            await new Promise(resolve => setTimeout(resolve, 1500)); 

            setSendStatus({ type: 'success', text: `Message prepared for ${selectedCreatorForContact?.robloxUsername}. In a real app, this would be sent.` });
            setTimeout(() => {
                // Optional: clear form or close modal
            }, 3000);
            setIsSending(false);
        };

        if (!showContactModal || !selectedCreatorForContact) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
                <div className="bg-gray-800 p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar relative">
                    <button onClick={closeContactModal} className="absolute top-4 right-4 text-gray-400 hover:text-red-500">
                        <X size={24} />
                    </button>
                    <h3 className="text-2xl font-bold mb-6 text-center text-red-400">Contact {selectedCreatorForContact.robloxUsername}</h3>
                    {sendStatus.text && (
                        <div className={`p-3 mb-4 rounded-md text-center text-sm ${sendStatus.type === 'success' ? 'bg-green-600' : 'bg-red-700'}`}>
                            {sendStatus.text}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="contact_name" className="block text-sm font-medium text-gray-300 mb-1">Your Name</label>
                            <input type="text" name="name" id="contact_name" value={contactData.name} onChange={handleChange} required className="w-full bg-gray-700 border-gray-600 text-white rounded-lg p-3 focus:ring-red-500 focus:border-red-500" />
                        </div>
                        <div>
                            <label htmlFor="contact_robloxUsername" className="block text-sm font-medium text-gray-300 mb-1">Your Roblox Username</label>
                            <input type="text" name="robloxUsername" id="contact_robloxUsername" value={contactData.robloxUsername} onChange={handleChange} required className="w-full bg-gray-700 border-gray-600 text-white rounded-lg p-3 focus:ring-red-500 focus:border-red-500" />
                        </div>
                        <div>
                            <label htmlFor="contact_budget" className="block text-sm font-medium text-gray-300 mb-1">Your Budget (Robux)</label>
                            <input type="number" name="budget" id="contact_budget" value={contactData.budget} onChange={handleChange} required className="w-full bg-gray-700 border-gray-600 text-white rounded-lg p-3 focus:ring-red-500 focus:border-red-500" />
                        </div>
                        <div>
                            <label htmlFor="contact_gameLink" className="block text-sm font-medium text-gray-300 mb-1">Your Game Link</label>
                            <input type="url" name="gameLink" id="contact_gameLink" value={contactData.gameLink} onChange={handleChange} required className="w-full bg-gray-700 border-gray-600 text-white rounded-lg p-3 focus:ring-red-500 focus:border-red-500" />
                        </div>
                        <div>
                            <label htmlFor="contact_message" className="block text-sm font-medium text-gray-300 mb-1">Message</label>
                            <textarea name="message" id="contact_message" value={contactData.message} onChange={handleChange} rows="3" required className="w-full bg-gray-700 border-gray-600 text-white rounded-lg p-3 focus:ring-red-500 focus:border-red-500 custom-scrollbar"></textarea>
                        </div>
                        <div>
                            <label htmlFor="contact_contactInfo" className="block text-sm font-medium text-gray-300 mb-1">Your Contact (Email or Discord)</label>
                            <input type="text" name="contactInfo" id="contact_contactInfo" value={contactData.contactInfo} onChange={handleChange} required className="w-full bg-gray-700 border-gray-600 text-white rounded-lg p-3 focus:ring-red-500 focus:border-red-500" />
                        </div>
                        <button type="submit" disabled={isSending} className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50">
                            {isSending ? 'Sending...' : 'Send Message'}
                        </button>
                         <p className="text-xs text-gray-500 mt-2 text-center">Note: This form is for demonstration. Actual message delivery to the creator requires backend setup.</p>
                    </form>
                </div>
            </div>
        );
    };

    const renderPage = () => {
        if (!isAuthReady && isLoading) { 
             console.log("WickApp: Auth not ready, showing main loading screen.");
             return (
                <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center text-center px-4 py-10">
                    <h1 className="text-3xl font-bold text-red-500">wick</h1>
                    <p className="text-xl text-gray-300 mt-2">Initializing Marketplace...</p>
                </div>
            );
        }

        switch (currentPage) {
            case 'home':
                // Pass creators and isLoading to HomePage
                return <HomePage creators={creators} isLoadingCreators={isLoading} navigate={navigate} />;
            case 'creator-directory':
                return <CreatorDirectoryPage />;
            case 'submit-listing':
                return <SubmitListingPage />;
            case 'how-it-works':
                return <HowItWorksPage />;
            case 'terms-privacy':
                return <TermsPrivacyPage />;
            default:
                console.warn("WickApp: Unknown page requested:", currentPage, "defaulting to home.");
                 // Pass creators and isLoading to HomePage for default case too
                return <HomePage creators={creators} isLoadingCreators={isLoading} navigate={navigate} />;
        }
    };

    return (
        <div className="bg-gray-900 min-h-screen font-inter">
            {/* MODIFIED: Removed jsx and global props from style tag */}
            <style>{`
                body {
                    font-family: 'Inter', sans-serif;
                    background-color: #111827; /* bg-gray-900 */
                }
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=Orbitron:wght@400;700;900&display=swap');
                
                .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #374151; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #4B5563; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6B7280; }

                .animate-fade-in-down { animation: fadeInDown 0.5s ease-out forwards; }
                .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
                .animation-delay-500 { animation-delay: 0.5s; }
                @keyframes fadeInDown { 0% { opacity: 0; transform: translateY(-20px); } 100% { opacity: 1; transform: translateY(0); } }
                @keyframes fadeInUp { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
                .bg-gray-850 { background-color: #1f2937; } /* A slightly lighter dark shade for section distinction */

            `}</style>
            <Navbar />
            <main>
                {renderPage()}
            </main>
            <ContactCreatorModal />
            <footer className="bg-gray-950 text-center py-6 text-gray-500 border-t border-gray-800">
                <p>&copy; {new Date().getFullYear()} wick - Roblox Game Promotion Marketplace. Not affiliated with Roblox Corp.</p>
                {userId && <p className="text-xs mt-1">Your User ID: {userId}</p>}
            </footer>
        </div>
    );
};

export default App;


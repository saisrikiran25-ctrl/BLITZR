// campus.dictionary.ts

/**
 * Strict Ledger of known Indian Universities with multi-campus presence.
 * This guarantees 100% precision in Row-Level Multi-Tenancy routing and
 * prevents isolated ghost-towns caused by user typos (e.g. "Delhi" vs "New Delhi").
 */
export const CAMPUS_DICTIONARY: Record<string, string[]> = {
    // 1. Amity University
    'amity.edu': ['Noida', 'Lucknow', 'Greater Noida', 'Gurugram', 'Mumbai', 'Jaipur', 'Raipur', 'Gwalior', 'Kolkata', 'Ranchi', 'Patna', 'Mohali'],

    // 2. Amrita Vishwa Vidyapeetham
    'amrita.edu': ['Coimbatore', 'Chennai', 'Amritapuri', 'Bengaluru', 'Mysore', 'Amaravati', 'Faridabad', 'Haridwar'],

    // 3. VIT (Vellore Institute of Technology)
    'vit.ac.in': ['Vellore', 'Chennai', 'Amaravati', 'Bhopal', 'Bengaluru'],

    // 4. BITS Pilani (Birla Institute of Technology and Science)
    'bits-pilani.ac.in': ['Pilani', 'Goa', 'Hyderabad', 'Dubai', 'Mumbai'],

    // 5. Manipal Academy of Higher Education (MAHE)
    'manipal.edu': ['Manipal', 'Bengaluru', 'Jaipur'],

    // 6. Symbiosis International University
    'siu.edu.in': ['Pune', 'Bengaluru', 'Hyderabad', 'Noida', 'Nagpur', 'Nashik', 'Lavale'],

    // 7. SRM Institute of Science and Technology
    'srmist.edu.in': ['Kattankulathur', 'Ramapuram', 'Vadapalani', 'Amaravati', 'Sonepat', 'Tiruchirappalli'],

    // 8. NMIMS (Narsee Monjee Institute of Management Studies)
    'nmims.edu': ['Mumbai', 'Navi Mumbai', 'Shirpur', 'Hyderabad', 'Bengaluru', 'Indore'],

    // 9. ICFAI University Group
    'icfaiuniversity.in': ['Hyderabad', 'Dehradun', 'Jaipur', 'Tripura', 'Mizoram', 'Meghalaya', 'Sikkim', 'Jharkhand', 'Nagaland', 'Raipur', 'Himachal Pradesh'],

    // 10. Sikkim Manipal University
    'smu.edu.in': ['Gangtok'],

    // 11. Jain (Deemed-to-be) University
    'jainuniversity.ac.in': ['JC Road', 'Jayanagar', 'Global Campus', 'JP Nagar', 'Gandhi Nagar', 'Whitefield', 'Kochi'],

    // 12. Christ University
    'christuniversity.in': ['Central Campus', 'Bannerghatta Road', 'Yeshwanthpur', 'Kengeri', 'Pune Lavasa', 'Delhi NCR'],

    // 13. Anna University
    'annauniv.edu': ['Chennai', 'Coimbatore', 'Madurai', 'Tirunelveli', 'Tiruchirappalli', 'Villupuram', 'Tindivanam', 'Arni', 'Kanchipuram', 'Nagercoil', 'Panruti', 'Ariyalur', 'Thirukkuvalai', 'Pattukkottai', 'Ramanathapuram', 'Dindigul', 'Thoothukudi'],

    // 14. Chitkara University
    'chitkara.edu.in': ['Rajpura', 'Baddi'],

    // 15. Lovely Professional University (LPU)
    'lpu.co.in': ['Phagwara'],

    // 16. Chandigarh University
    'cuchd.in': ['Gharuan'],

    // 17. KLE Technological University
    'kletech.ac.in': ['Hubballi', 'Belagavi', 'Bengaluru'],

    // 18. Graphic Era University/Hill University
    'geu.ac.in': ['Dehradun', 'Haldwani', 'Bhimtal'],

    // 19. JSS Academy of Higher Education & Research
    'jssuni.edu.in': ['Mysuru', 'Ootacamund'],

    // 20. PES University
    'pes.edu': ['Banashankari', 'Electronic City', 'Hanumanth Nagar', 'Kuppam', 'Chittoor'],

    // 21. Dayananda Sagar University
    'dsu.edu.in': ['Harohalli', 'Kudlu Gate'],

    // 22. CMR University
    'cmr.edu.in': ['OMBR', 'City Campus', 'Main Campus', 'ITPL'],

    // 23. MIT Art, Design and Technology University
    'mituniversity.edu.in': ['Pune', 'Guwahati'],

    // 24. DY Patil Group Universities
    'dpu.edu.in': ['Pimpri', 'Navi Mumbai', 'Kolhapur', 'Lohegaon', 'Akurdi', 'Ambi', 'Talegaon'],

    // 25. Sharda University
    'sharda.ac.in': ['Greater Noida', 'Agra', 'Mathura'],

    // 26. Jaypee Institute of Information Technology (JIIT)
    'jiit.ac.in': ['Sector 62', 'Sector 128'],

    // 27. UPES (University of Petroleum and Energy Studies)
    'upes.ac.in': ['Bidholi'],

    // 28. Galgotias University
    'galgotiasuniversity.edu.in': ['Greater Noida'],

    // 29. Thapar Institute of Engineering and Technology
    'thapar.edu': ['Patiala', 'Behra'],

    // 30. GNA University
    'gnauniversity.edu.in': ['Phagwara'],

    // 31. Shoolini University
    'shooliniuniversity.com': ['Solan'],

    // 32. RV University
    'rvu.edu.in': ['Bengaluru'],

    // 33. Alliance University
    'alliance.edu.in': ['Bengaluru'],

    // 34. Presidency University
    'presidencyuniversity.in': ['Bengaluru'],

    // 35. Karunya Institute of Technology and Sciences
    'karunya.edu': ['Coimbatore'],

    // 36. Sathyabama Institute of Science and Technology
    'sathyabama.ac.in': ['Sholinganallur', 'Sithalapakkam', 'Sriperumbudur'],

    // 37. Hindustan Institute of Technology and Science
    'hindustanuniv.ac.in': ['Kelambakkam'],

    // 38. Vel Tech Rangarajan Dr. Sagunthala R&D Institute
    'veltech.edu.in': ['Avadi'],

    // 39. Kalinga Institute of Industrial Technology (KIIT)
    'kiit.ac.in': ['Bhubaneswar'],

    // 40. Bennett University
    'bennett.edu.in': ['Greater Noida'],

    // 41. ITM University
    'itmuniversity.ac.in': ['Gwalior'],

    // 42. GD Goenka University
    'gdgoenkauniversity.com': ['Gurugram'],

    // 43. Indira Gandhi National Open University (IGNOU)
    'ignou.ac.in': ['New Delhi', 'Aligarh', 'Lucknow', 'Noida', 'Varanasi', 'Mumbai', 'Pune', 'Nagpur'],

    // 44. Yashwantrao Chavan Maharashtra Open University
    'ycmou.ac.in': ['Nashik'],

    // 45. Dr. BR Ambedkar Open University
    'braou.ac.in': ['Hyderabad'],

    // 46. Central Universities
    'jnu.ac.in': ['New Delhi'],
    'uohyd.ac.in': ['Telangana'],
    'curaj.ac.in': ['Ajmer'],
    'cup.edu.in': ['Bathinda'],
    'cuk.ac.in': ['Gulbarga'],
    'cukerala.ac.in': ['Kasaragod'],

    // 47. Birla Institute of Technology (BIT)
    'bitmesra.ac.in': ['Mesra', 'Patna', 'Deoghar', 'Jaipur', 'Noida'],

    // 48. Bharati Vidyapeeth
    'bharatividyapeeth.edu': ['Pune', 'Delhi', 'Navi Mumbai', 'Sangli', 'Kolhapur'],

    // 49. Savitribai Phule Pune University
    'unipune.ac.in': ['Pune', 'Mumbai'],

    // 50. University of Mumbai
    'mu.ac.in': ['Fort', 'Kalina'],

    // Indian Institute of Foreign Trade
    'iift.edu': ['Delhi', 'Kolkata', 'Kakinada'],

    // Somaiya University
    'somaiya.edu': ['Vidyavihar', 'Sion']
};

/**
 * Validates a requested campus against the strict dictionary.
 * 
 * Scenario A: Domain has mapped campuses. User MUST select one of them exact-match.
 * Scenario B: Domain is unknown. User bypasses campus selection, defaults to "main".
 */
export function resolveCampusDomain(domain: string, requestedCampus?: string): string {
    const validCampuses = CAMPUS_DICTIONARY[domain];

    // Scenario A: Known Multi-Campus
    if (validCampuses && validCampuses.length > 0) {
        if (!requestedCampus) {
            throw new Error(`Campus required for domain: ${domain}`);
        }
        if (!validCampuses.includes(requestedCampus)) {
            throw new Error(`Invalid campus '${requestedCampus}' for domain ${domain}. Valid options: ${validCampuses.join(', ')}`);
        }
        return `${domain}_${requestedCampus.toLowerCase()}`;
    }

    // Scenario B: Unknown / Single Campus
    return `${domain}_main`;
}

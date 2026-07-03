import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import axios from '../lib/axios'
import ProductCard from './ProductCard'
import LoadingSpinner from './LoadingSpinner'

const RecommendedProducts = () => {
    const [recommendedProducts, setRecommendedProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const res = await axios.get('/products/recommendedProducts');
                setRecommendedProducts(res.data.recommendedProducts);
            } catch (error) {
                toast.error(error.response.data || "An error occurred while fetching recommendedProducts");
            } finally {
                setIsLoading(false);
            }
        }
        fetchRecommendations();
    }, []);

    if (isLoading) return <LoadingSpinner />

    return (
        <div className='mt-8'>
            <h3 className='text-2xl font-semibold text-emerald-400'>Recommended Products</h3>
            <div className='mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                {recommendedProducts?.map((product) => (
                    <ProductCard key={product._id} product={product} />
                ))}
            </div>
        </div>
    )
}

export default RecommendedProducts
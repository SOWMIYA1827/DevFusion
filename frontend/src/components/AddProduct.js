import { useState } from "react";
import "./AddProduct.css";

function AddProduct(props){

    const [ptitle,setTitle] = useState('');
    const [pprice,setPrice] = useState('');
    const [pdesc,setDesc] = useState('');
    const [pcat,setCat] = useState('');
    const [pimage,setImage] = useState('');

    function titleHandler(event){
        setTitle(event.target.value);
    }

    function priceHandler(event){
        setPrice(event.target.value);
    }

    function descHandler(event){
        setDesc(event.target.value);
    }

    function catHandler(event){
        setCat(event.target.value);
    }

    function imageHandler(event){
        setImage(event.target.value);
    }

    function saveProducts(event){

        event.preventDefault();

        const product = {

            title: ptitle,

            price: pprice,

            description: pdesc,

            category: pcat,

            image: pimage

        }

        props.saveProducts(product);

        setTitle('');
        setPrice('');
        setDesc('');
        setCat('');
        setImage('');
    }

    return(

        <div className="add-product-container">

            <h1 className="add-product-heading">
                Add Product
            </h1>

            <form
                className="add-product-form"
                onSubmit={saveProducts}
            >

                <label className="add-product-label">
                    Title
                </label>

                <input
                    className="add-product-input"
                    type="text"
                    onChange={titleHandler}
                    value={ptitle}
                />

                <br />

                <label className="add-product-label">
                    Price
                </label>

                <input
                    className="add-product-input"
                    type="text"
                    onChange={priceHandler}
                    value={pprice}
                />

                <br />

                <label className="add-product-label">
                    Description
                </label>

                <input
                    className="add-product-input"
                    type="text"
                    onChange={descHandler}
                    value={pdesc}
                />

                <br />

                <label className="add-product-label">
                    Category
                </label>

                <input
                    className="add-product-input"
                    type="text"
                    onChange={catHandler}
                    value={pcat}
                />

                <br />

                <label className="add-product-label">
                    Image
                </label>

                <input
                    className="add-product-input"
                    type="text"
                    onChange={imageHandler}
                    value={pimage}
                />

                <br />

                <button
                    className="add-product-button"
                    type="submit"
                >
                    Submit
                </button>

            </form>

        </div>
    )
}

export default AddProduct;
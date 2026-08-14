import { useState } from "react";
import "./ProductDetails.css";

function ProductDetails(props) {

  const [search, setSearch] = useState("");

  const [edit, setEdit] = useState(false);
  const [pid, setId] = useState('');
  const [ptitle, setTitle] = useState('');
  const [pprice, setPrice] = useState('');
  const [pdesc, setDesc] = useState('');
  const [pcat, setCat] = useState('');
  const [pimage, setImage] = useState('');

  const [flippedId, setFlippedId] = useState(null);

  const filteredProduct = props.products.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  function deleteProducts(id) {
    props.deleteProducts(id);
  }

  function editProducts(product) {
    setEdit(true);
    setId(product.id);
    setTitle(product.title);
    setPrice(product.price);
    setDesc(product.description);
    setCat(product.category);
    setImage(product.image);
  }

  function updateProducts(e) {
    e.preventDefault();

    props.updateProducts({
      id: pid,
      title: ptitle,
      price: pprice,
      description: pdesc,
      category: pcat,
      image: pimage
    });

    setEdit(false);
  }

  function flipCard(id) {
    setFlippedId(flippedId === id ? null : id);
  }

  return (
    <div className="product-page">

      <h1>Admin Product Details</h1>

      {/* SEARCH */}
      <div className="search-box">
        <input
          type="text"
          placeholder="Search Product..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* GRID */}
      <div className="product-grid">

        {filteredProduct.map((product) => (

          <div
            className={`flip-card ${flippedId === product.id ? "flipped" : ""}`}
            key={product.id}
            onClick={() => flipCard(product.id)}
          >

            <div className="flip-card-inner">

              {/* FRONT */}
              <div className="flip-card-front">

                <img src={product.image} alt={product.title} />

                <h3>{product.title}</h3>

                <h2>₹ {product.price}</h2>

              </div>

              {/* BACK */}
              <div className="flip-card-back">

                <h3>{product.category}</h3>

                <p>{product.description}</p>

                <p><strong>ID:</strong> {product.id}</p>

                <div className="btn-group">

                  <button
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteProducts(product.id);
                    }}
                  >
                    🗑 Delete
                  </button>

                  <button
                    className="edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      editProducts(product);
                    }}
                  >
                    ✏ Edit
                  </button>

                </div>

              </div>

            </div>

          </div>

        ))}

      </div>

      {/* EDIT FORM */}
      {edit && (
        <form className="edit-form" onSubmit={updateProducts}>

          <h2>Edit Product</h2>

          <input value={ptitle} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
          <input value={pprice} onChange={(e) => setPrice(e.target.value)} placeholder="Price" />
          <input value={pdesc} onChange={(e) => setDesc(e.target.value)} placeholder="Description" />
          <input value={pcat} onChange={(e) => setCat(e.target.value)} placeholder="Category" />
          <input value={pimage} onChange={(e) => setImage(e.target.value)} placeholder="Image URL" />

          <button type="submit">Update</button>

        </form>
      )}

    </div>
  );
}

export default ProductDetails;
function Layout({children}){
    return (
        <div>

            <header>
                <h1>My Products</h1>
            </header>

            {children}

            <footer>
                <p>&copy; 2023 My Products. All rights reserved.</p>
            </footer>
        </div>
    );

}

export default Layout;
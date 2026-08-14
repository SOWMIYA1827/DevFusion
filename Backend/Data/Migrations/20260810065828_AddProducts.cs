using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace DevFusionAPI.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddProducts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "products",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Title = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Description = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Category = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Image = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_products", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.InsertData(
                table: "products",
                columns: new[] { "Id", "Category", "Description", "Image", "Price", "Title" },
                values: new object[,]
                {
                    { 1, "men's clothing", "Your perfect pack for everyday use and walks in the forest. Stash your laptop (up to 15 inches) in the padded sleeve, your daily details in the spacious main compartment.", "https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg", 109.95m, "Fjallraven - Foldsack No. 1 Backpack, Fits 15 Laptops" },
                    { 2, "men's clothing", "Slim-fitting style, contrast raglan long sleeve, three-button henley placket, light weight & soft fabric for breathable and comfortable wearing. And Solid stitched shirts with round neck made for durability and a great fit for casual fashion wear and diehard baseball fans. The henley style round neckline includes a three-button placket.", "https://fakestoreapi.com/img/71-3HjGNDUL._AC_SY879._SX._UX._SYY_.jpg", 22.3m, "Mens Casual Premium Slim Fit T-Shirts" },
                    { 3, "men's clothing", "great outerwear jackets for Spring/Autumn/Winter, suitable for many occasions, such as working, hiking, camping, mountain/rock climbing, cycling, traveling or other outdoors. Good gift choice for you or your family member. A warm hearted love to Father, husband or son in this thanksgiving or Christmas Day.", "https://fakestoreapi.com/img/71li-alvuCL._AC_UX679_.jpg", 55.99m, "Mens Cotton Jacket" }
                });

            migrationBuilder.UpdateData(
                table: "users",
                keyColumn: "Id",
                keyValue: "user_1",
                column: "PasswordHash",
                value: "$2a$11$Hmyj21s7SAO240/1vddRNO2rcUyf9atf2TkATle5PvSqn2KU2U3ou");

            migrationBuilder.UpdateData(
                table: "users",
                keyColumn: "Id",
                keyValue: "user_2",
                column: "PasswordHash",
                value: "$2a$11$CEBeFnWlTFFtwebxyJ6J9eJiMI0MUGCfKek24drJVf4IPhW761NA6");

            migrationBuilder.UpdateData(
                table: "users",
                keyColumn: "Id",
                keyValue: "user_3",
                column: "PasswordHash",
                value: "$2a$11$ipXykcUHD97LVpfruNkNtOq5.KM.i.5yo/KtqOLe8X6r4gneuWgG6");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "products");

            migrationBuilder.UpdateData(
                table: "users",
                keyColumn: "Id",
                keyValue: "user_1",
                column: "PasswordHash",
                value: "$2a$11$krp1W.AThQpU0/Yf2DSCVOqzLfyXWOweIkyOhR0Ymptr1JcWDOhe.");

            migrationBuilder.UpdateData(
                table: "users",
                keyColumn: "Id",
                keyValue: "user_2",
                column: "PasswordHash",
                value: "$2a$11$kI5nL7biiiCy11UasQQf9u09SLKC4I/L7mH344WaQuYXN2GuQn7v6");

            migrationBuilder.UpdateData(
                table: "users",
                keyColumn: "Id",
                keyValue: "user_3",
                column: "PasswordHash",
                value: "$2a$11$gYE9eiYZOdNkrTIzlL2bjOEaU8nuR1TmTahhPwzVaqOaGXLWhG5e2");
        }
    }
}

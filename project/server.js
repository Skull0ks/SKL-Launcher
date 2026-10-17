// ============================================================
// CS2 Skin Upgrader - Express Backend Server
// ============================================================

require('dotenv').config();

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
const cors = require('cors');
const path = require('path');

const app = express();

const PORT = process.env.PORT || 3000;
const DOMAIN = process.env.DOMAIN || `http://localhost:${PORT}`;
const SESSION_SECRET = process.env.SESSION_SECRET || 'cs2-upgrader-default-secret';
const STEAM_API_KEY = process.env.STEAM_API_KEY;
const DEMO_MODE = !STEAM_API_KEY || STEAM_API_KEY === 'YOUR_STEAM_API_KEY_HERE';

if (DEMO_MODE) {
  console.log('⚠️  No Steam API key configured - running in DEMO MODE');
  console.log('   Set STEAM_API_KEY in .env to enable real Steam login');
}

// ============================================================
// Mock Data - CS2 Skins Inventory
// ============================================================

const MOCK_INVENTORY = [
  {
    id: 'inv-001',
    name: 'AK-47 | Redline',
    price: 12.50,
    image: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UXnczMHWoN-shBRTjG1vJj-Kh5dPZi0HZTuCB9ZLbNGpbRvkIW9E_hry0WXZQy9LtyFD7AT_sYTs-B0xR1bEIbhrzOBNhVL2-TzaAFU4N3ny4XSx6P0a-uExWkE6Z0j3-vE8ICt2ADk80M4MWHxdYKSdg48YVqB-le_xO_vjcDpuJrOm3Bi6XYntCqIlhXkkx8aP4k/'),
    rarity: 'Classified',
    weapon: 'AK-47',
    exterior: 'Field-Tested'
  },
  {
    id: 'inv-002',
    name: 'AWP | Asiimov',
    price: 28.00,
    image: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UXnczMHWoN-shBRTjG1vJj-Kh5dPZi0HZTuCB9ZLbNGpbRvkIW9E_hry0WXZQy9LtyFD7AT_sYTs-B1xBdaIhWM5cp9g-Xywaf9c7kUvI-JkoG0m_7zO6_YkGhXvZ0o0uvApI3x3wy1-0FoY2j7d4aLMlhp/',
    rarity: 'Covert',
    weapon: 'AWP',
    exterior: 'Field-Tested'
  },
  {
    id: 'inv-003',
    name: 'Glock-18 | Fade',
    price: 185.00,
    image: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UXnczMHWoN-shBRTjG1vJj-Kh5dPZi0HZTuCB9ZLbNGpbRvkIW9E_hry0WXZQy9LtyFD7AT_sYTs-B0xR1bIR7G5OBef0Dl2-T3YzhF49OJlY20k_OmMrjQhGtc18l4jeHVyoD8j1yg5UBsMWiiJ9TBdlI_NVuD_FK5kLjq0JO56Z-fwSFk7HQn4yrfzRep1xwSa-sI-jWd/',
    rarity: 'Restricted',
    weapon: 'Glock-18',
    exterior: 'Factory New'
  },
  {
    id: 'inv-004',
    name: 'USP-S | Kill Confirmed',
    price: 42.00,
    image: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UXnczMHWoN-shBRTjG1vJj-Kh5dPZi0HZTuCB9ZLbNGpbRvkIW9E_hry0WXZQy9LtyFD7AT_sYTs-B0xR1bEILWoJOBe1Dn3tjJIWdGtYvlx9XZwqOpZe-Bz2pTu5Em2LuR84-h2wK1-EJsZW73JoCVMFBvZF-E8lm9yObohJfs05qfzSFjvCgh5nfUzECuhhtSLrs4r6saW1GKKQ/',
    rarity: 'Covert',
    weapon: 'USP-S',
    exterior: 'Field-Tested'
  },
  {
    id: 'inv-005',
    name: 'M4A4 | Desolate Space',
    price: 8.75,
    image: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UXnczMHWoN-shBRTjG1vJj-Kh5dPZi0HZTuCB9ZLbNGpbRvkIW9E_hry0WXZQy9LtyFD7AT_sYTs-B0xR1bEILG5JOBe1dn3fKRcjV9MtazkYTSkaa_Ye2IlTNW6cFy27rFpImt3Azm_RFtYz3xI4CXeg5oZlqC-1O_w-e8h5DpuJXMz3s1snIn4S3YnELi0BNSOOJY-6Oh/',
    rarity: 'Classified',
    weapon: 'M4A4',
    exterior: 'Minimal Wear'
  },
  {
    id: 'inv-006',
    name: 'Desert Eagle | Blaze',
    price: 95.00,
    image: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UXnczMHWoN-shBRTjG1vJj-Kh5dPZi0HZTuCB9ZLbNGpbRvkIW9E_hry0WXZQy9LtyFD7AT_sYTs-B0xR1bIR7W4OBef0Dl2-TzYThO7daJl4-ClvD4JrjukzJUu8cg4t-T8N-j0FCw_0I-Z2-iJ4aXelQ3aA6C-wO-x7vqg8O86sicm3A/',
    rarity: 'Restricted',
    weapon: 'Desert Eagle',
    exterior: 'Factory New'
  },
  {
    id: 'inv-007',
    name: 'P250 | See Ya Later',
    price: 3.20,
    image: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UXnczMHWoN-shBRTjG1vJj-Kh5dPZi0HZTuCB9ZLbNGpbRvkIW9E_hry0WXZQy9LtyFD7AT_sYTs-B0xR1bEILG5JOBe1dn3tjRIzpd_8t_RlaG0lfj7DqBYj8Bx8cjD8I6d0QXs_EVqZR1tKemcd2XdwY7MliD92cyTr5S/',
    rarity: 'Classified',
    weapon: 'P250',
    exterior: 'Factory New'
  },
  {
    id: 'inv-008',
    name: 'FAMAS | Mecha Industries',
    price: 1.85,
    image: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UXnczMHWoN-shBRTjG1vJj-Kh5dPZi0HZTuCB9ZLbNGpbRvkIW9E_hry0WXZQy9LtyFD7AT_sYTs-B0xR1bEILG5JOBe1dn3fjKcjhP7dOJloG0mvnmJrjQkl1d6MJ4j-jH8NKm0Ae3-0FuajzzctCVcABqZF7RqVm4w-fphcTpuJnIyXFh6XUn4yyMyBel1k5Ie8cHrkW/',
    rarity: 'Classified',
    weapon: 'FAMAS',
    exterior: 'Minimal Wear'
  },
  {
    id: 'inv-009',
    name: 'M4A1-S | Hyper Beast',
    price: 18.50,
    image: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UXnczMHWoN-shBRTjG1vJj-Kh5dPZi0HZTuCB9ZLbNGpbRvkIW9E_hry0WXZQy9LtyFD7AT_sYTs-B0xR1bEILG5JOBe1dn3djJIzpV4N3jwYTQxaCtZe2IxjlRvpR12-bF8IqiiQax_hY_MWimJoeXelBvYlvVqFO3l-a815S76J_OySBqvHQnty7ZmRLigB9La-Jvx6KaVxzd/',
    rarity: 'Covert',
    weapon: 'M4A1-S',
    exterior: 'Field-Tested'
  },
  {
    id: 'inv-010',
    name: 'AK-47 | Vulcan',
    price: 22.00,
    image: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UXnczMHWoN-shBRTjG1vJj-Kh5dPZi0HZTuCB9ZLbNGpbRvkIW9E_hry0WXZQy9LtyFD7AT_sYTs-B1xBdaIhSM5ep9i_X2xlQ_7drKR4ffxtL_ZPSX4b_Sm29H7Z5317bH8Iz61AW1qBE_PmDwLNDSelNqYAvS81Xtx-bqhcK1uJnKyiFhuyUq7XqPlxTjhh1Kbpxz0aLLJl8aALBd/',
    rarity: 'Covert',
    weapon: 'AK-47',
    exterior: 'Minimal Wear'
  },
  {
    id: 'inv-011',
    name: 'AWP | Fever Dream',
    price: 4.25,
    image: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UXnczMHWoN-shBRTjG1vJj-Kh5dPZi0HZTuCB9ZLbNGpbRvkIW9E_hry0WXZQy9LtyFD7AT_sYTs-B0xR1bEILG5JOBe1dn3djJd19V4NbjxYTQkKDxMLjQkm5u5MBjjejMoNumiVLj_UU5a2CgcNfGJlM4Z17V_VTtwevn1p69uZScyCdhuSsl/',
    rarity: 'Classified',
    weapon: 'AWP',
    exterior: 'Field-Tested'
  },
  {
    id: 'inv-012',
    name: 'P90 | Asiimov',
    price: 6.30,
    image: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UXnczMHWoN-shBRTjG1vJj-Kh5dPZi0HZTuCB9ZLbNGpbRvkIW9E_hry0WXZQy9LtyFD7AT_sYTs-B0xR1bEILG5JOBe1dn3djJd19V4NbjxYTQxfP6LOmIk2lUscAg27rFoY-h3Ffs_kJsYDr3J9eSelM5Yl6D_VK4w-fth8TpuJvBzXsw6XYi4CqIzRzjhx0SOJ1Ox6GaV/',
    rarity: 'Covert',
    weapon: 'P90',
    exterior: 'Minimal Wear'
  },
  {
    id: 'inv-013',
    name: 'SG 553 | Integrale',
    price: 0.75,
    image: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UXnczMHWoN-shBRTjG1vJj-Kh5dPZi0HZTuCB9ZLbNGpbRvkIW9E_hry0WXZQy9LtyFD7AT_sYTs-B0xR1bEILG5JOBe1dn3djdY1da_8d7ik9bkl6T0YemEl28AucFy2LHC9NqhjAO3_RBtZW37I4WdcwY6ZF_T_gK9xOm91Me9v5icySMyvz5iuyg/',
    rarity: 'Mil-Spec',
    weapon: 'SG 553',
    exterior: 'Factory New'
  },
  {
    id: 'inv-014',
    name: 'Five-SeveN | Monkey Business',
    price: 2.10,
    image: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UXnczMHWoN-shBRTjG1vJj-Kh5dPZi0HZTuCB9ZLbNGpbRvkIW9E_hry0WXZQy9LtyFD7AT_sYTs-B0xR1bEILG5JOBe1dn3djJd19V4NbjxYTQxaOtZe-HxDgBuZUp0teTrNSt3gft_kI5aj36I9SSdAY6YlqG-QK9ku3qhcW0uZ-byiE26XQ/',
    rarity: 'Restricted',
    weapon: 'Five-SeveN',
    exterior: 'Minimal Wear'
  },
  {
    id: 'inv-015',
    name: 'MAC-10 | Neon Rider',
    price: 3.90,
    image: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UXnczMHWoN-shBRTjG1vJj-Kh5dPZi0HZTuCB9ZLbNGpbRvkIW9E_hry0WXZQy9LtyFD7AT_sYTs-B0xR1bEILG5JOBe1dn3djRJzJA_9uyh5LYkPbgYeqExj4Fu5Vy2LqZoY_w3lHl_0VrYzqhJ9XGewRqNQ7X8gTsxuvqjcftuMnKzCAw6SIg7yzImkPih09HYbNuxanAHvfCJEs/',
    rarity: 'Classified',
    weapon: 'MAC-10',
    exterior: 'Factory New'
  },
  {
    id: 'inv-016',
    name: 'UMP-45 | Primal Saber',
    price: 1.50,
    image: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UXnczMHWoN-shBRTjG1vJj-Kh5dPZi0HZTuCB9ZLbNGpbRvkIW9E_hry0WXZQy9LtyFD7AT_sYTs-B0xR1bEILG5JOBe1dn3djJd19V4NbjxYTQkvP7ML3Qkm5u5MB-jeiMpN-h3Ffs80o4amCgd4OQJFJrZVqB-1K_lOvshcO4vZieyXo3vSQktSrYnRHh0ElSb-Zaxf_NYwsAtQoOA/',
    rarity: 'Classified',
    weapon: 'UMP-45',
    exterior: 'Field-Tested'
  },
  {
    id: 'inv-017',
    name: 'Nova | Hyper Beast',
    price: 0.50,
    image: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UXnczMHWoN-shBRTjG1vJj-Kh5dPZi0HZTuCB9ZLbNGpbRvkIW9E_hry0WXZQy9LtyFD7AT_sYTs-B0xR1bEILG5JOBe1dn3djJd19V4NbjxYTQxa_wYemExW8J7JYh0--VrY6m2gDt_UdsN233IYWSJQY2aA6E8gDqkr-5g5K9upjPm3M1uykn7C3VzhWxhUxSLrs42jWEWHfLUNET/',
    rarity: 'Classified',
    weapon: 'Nova',
    exterior: 'Minimal Wear'
  },
  {
    id: 'inv-018',
    name: 'AK-47 | Neon Rider',
    price: 35.00,
    image: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UXnczMHWoN-shBRTjG1vJj-Kh5dPZi0HZTuCB9ZLbNGpbRvkIW9E_hry0WXZQy9LtyFD7AT_sYTs-B0xR1bEILG5JOBe1dn3djRczpb_9cyzh4SQkvP7P-Ldk39VsZcj2rLF9NenzAzn80VqZW-md4WddlA-YFiGqFi_w7u5hpfs78mf0nkF/',
    rarity: 'Covert',
    weapon: 'AK-47',
    exterior: 'Factory New'
  },
  {
    id: 'inv-019',
    name: 'CZ75-Auto | Victoria',
    price: 5.60,
    image: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UXnczMHWoN-shBRTjG1vJj-Kh5dPZi0HZTuCB9ZLbNGpbRvkIW9E_hry0WXZQy9LtyFD7AT_sYTs-B0xR1bEILG5JOBe1dn3djJd19V4NbjxYTQxa-tMO2IzzgFvJIp0u-T8d-giQe1_hE4YGumIIaRdgQ5YlzU81boxO3q15S_v5iYy3Yy6SV05ivfyhW00xwaOLEH-6Kf/',
    rarity: 'Classified',
    weapon: 'CZ75-Auto',
    exterior: 'Factory New'
  },
  {
    id: 'inv-020',
    name: 'MP9 | Hydra',
    price: 0.85,
    image: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UXnczMHWoN-shBRTjG1vJj-Kh5dPZi0HZTuCB9ZLbNGpbRvkIW9E_hry0WXZQy9LtyFD7AT_sYTs-B0xR1bEILG5JOBe1dn3djJd19V4NbjxYTQxaClMOyIxT0A6scu2rGToI2jiVCxqkM5NjqhJIOXewRvZV-D-FW_w7--gp-5vpifyXow6HIn5iqIlhTigRhSaMkY/',
    rarity: 'Restricted',
    weapon: 'MP9',
    exterior: 'Minimal Wear'
  }
];

// ============================================================
// Shop Data - Target Skins for Upgrading
// ============================================================

const SHOP_ITEMS = [
  {
    id: 'shop-001',
    name: '★ Karambit | Doppler',
    price: 1250.00,
    image: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UXnczMHWoN-shBRTjG1vJj-Kh5dPZi0HZTuCB9ZLbNGpbRvkIW9E_hry0WXZQy9LtyFD7AT_sYTs-B1xBdaIhSM5OR0e0v077RKIG0QuoS0xYTQz6ChZr-fkmkBu5cj1LYaIo1DhsULkfkVlMG3yJ4CQdAZvYA7W_FO7x-jmhZHp7crIy3Q_7yYl5y3Zzha21xwdOLEHraSPChmTi/',
    rarity: 'Covert',
    weapon: 'Knife',
    exterior: 'Factory New',
    category: 'Knife'
  },
  {
    id: 'shop-002',
    name: '★ Butterfly Knife | Fade',
    price: 2100.00,
    image: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UXnczMHWoN-shBRTjG1vJj-Kh5dPZi0HZTuCB9ZLbNGpbRvkIW9E_hry0WXZQy9LtyFD7AT_sYTs-B0xR1bEILG5JOBe1dn3djZI7JO0dO7kZLSxqOtZ-2J2DgOvMMOi7uVrdT33gHh_RM_ZW_0d4OQcQ86Yl-C-VK-k-e6hpW06M7IzHc26SV07SzfmRC2hBpJYbsK-jWaXF8a/',
    rarity: 'Covert',
    weapon: 'Knife',
    exterior: 'Factory New',
    category: 'Knife'
  },
  {
    id: 'shop-003',
    name: '★ M9 Bayonet | Crimson Web',
    price: 890.00,
    image: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UXnczMHWoN-shBRTjG1vJj-Kh5dPZi0HZTuCB9ZLbNGpbRvkIW9E_hry0WXZQy9LtyFD7AT_sYTs-B0xR1bEILG5JOBe1dn3djZI7JO0dO7kZLSxKOtZ-2Jl21T6ZN307-Yotqg3QLn_kRtYTz1cISWdlBqYF-D_1fqkOe8hpfu6pnInSBjvyMk5yrelxHj1ExEbOFaxfvNH7fIKJBn/',
    rarity: 'Covert',
    weapon: 'Knife',
    exterior: 'Minimal Wear',
    category: 'Knife'
  },
  {
    id: 'shop-004',
    name: '★ Sport Gloves | Hedge Maze',
    price: 750.00,
    image: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UXnczMHWoN-shBRTjG1vJj-Kh5dPZi0HZTuCB9ZLbNGpbRvkIW9E_hry0WXZQy9LtyFD7AT_sYTs-B0xR1bIR7W4OBef0Dl2-TzYzhF49OJl4y0mvnwYOOBxD1Xv8Eu2OrHpo72jFHm_kRoZGD1JIeVe1U8NV7T_FK5yOm91cS1uJjOz3NivSEk7CqJnQv330-8eFp2mg/',
    rarity: 'Extraordinary',
    weapon: 'Gloves',
    exterior: 'Field-Tested',
    category: 'Gloves'
  },
  {
    id: 'shop-005',
    name: '★ Specialist Gloves | Crimson Kimono',
    price: 1800.00,
    image: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UXnczMHWoN-shBRTjG1vJj-Kh5dPZi0HZTuCB9ZLbNGpbRvkIW9E_hry0WXZQy9LtyFD7AT_sYTs-B0xR1bIR7W4OBef0Dl2-TzYzhF49OJl4y0m_7nMLjQklRc7cFy07-T9NWnjQK1_0NtZjrzI4eVdlJqNVyB-APrle_mjcHvupvBzndq7ScrtHfUmBK2hR9EI7V-gufNH-fCJMs/',
    rarity: 'Extraordinary',
    weapon: 'Gloves',
    exterior: 'Field-Tested',
    category: 'Gloves'
  },
  {
    id: 'shop-006',
    name: 'M4A4 | Howl',
    price: 4500.00,
    image: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UXnczMHWoN-shBRTjG1vJj-Kh5dPZi0HZTuCB9ZLbNGpbRvkIW9E_hry0WXZQy9LtyFD7AT_sYTs-BxQmpGJJ-ivuehUwuP2P4jCc8p0xdPhx4TQx6ChMOyIxjkE6ccm2rqYpd2l2QXk_0NtMG-mLIeUelA3Z1nR_lm2xOi61MW975TIwncy6SM8pSGKykvjjA4oJtQ1/',
    rarity: 'Contraband',
    weapon: 'M4A4',
    exterior: 'Factory New',
    category: 'Rifle'
  },
  {
    id: 'shop-007',
    name: 'AK-47 | Fire Serpent',
    price: 480.00,
    image: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UXnczMHWoN-shBRTjG1vJj-Kh5dPZi0HZTuCB9ZLbNGpbRvkIW9E_hry0WXZQy9LtyFD7AT_sYTs-B0xR1bIR7W4OBef0Dl2-TzYzhF49OJl4y0m_7nNbnQhFRd18l4jeHVyoD8j1yg5UBtMW73d9WXdQRoZ1-C-1e5yLvs0Me06c6ayHMwvyMmsyqMnRS2hRpJa-dhx6KaJ1qs/',
    rarity: 'Covert',
    weapon: 'AK-47',
    exterior: 'Minimal Wear',
    category: 'Rifle'
  },
  {
    id: 'shop-008',
    name: 'AWP | Dragon Lore',
    price: 5000.00,
    image: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UXnczMHWoN-shBRTjG1vJj-Kh5dPZi0HZTuCB9ZLbNGpbRvkIW9E_hry0WXZQy9LtyFD7AT_sYTs-B0xR1bEILG5JOBe1dn3djJd19V4NbjxYTQxaOhY-iJxmkHucd12LDCoo-m0QDl-hBsMW73d9WXdQRoZ17T_Fm9yLi6jcDo7ZWcynF9-z5z/',
    rarity: 'Covert',
    weapon: 'AWP',
    exterior: 'Factory New',
    category: 'Sniper'
  },
  {
    id: 'shop-009',
    name: '★ Bayonet | Tiger Tooth',
    price: 320.00,
    image: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UXnczMHWoN-shBRTjG1vJj-Kh5dPZi0HZTuCB9ZLbNGpbRvkIW9E_hry0WXZQy9LtyFD7AT_sYTs-B0xR1bEILG5JOBe1dn3djJd19V4NbjxYTQxaOtZ-2J2DkI7MQj0--YoN-k31Dk80FvYDrzJYCXe1BrZ1vR_lK_lOi6gMTp78nIzCZg7HYisCuJnRyzghxFb7Y6/',
    rarity: 'Covert',
    weapon: 'Knife',
    exterior: 'Factory New',
    category: 'Knife'
  },
  {
    id: 'shop-010',
    name: '★ Flip Knife | Marble Fade',
    price: 410.00,
    image: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UXnczMHWoN-shBRTjG1vJj-Kh5dPZi0HZTuCB9ZLbNGpbRvkIW9E_hry0WXZQy9LtyFD7AT_sYTs-B0xR1bEILG5JOBe1dn3djJd19V4NbjxYTQxaClMOyIxjkE6cd0j-bH8IC7jVfl_kVoYjqgdIKRdlJtZ1_T_gK9kOfoj8K_upicy3M16HYi4SnYm0ClhRxLbO1umPeCXgD_UNEn/',
    rarity: 'Covert',
    weapon: 'Knife',
    exterior: 'Factory New',
    category: 'Knife'
  },
  {
    id: 'shop-011',
    name: 'AWP | Gungnir',
    price: 3200.00,
    image: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UXnczMHWoN-shBRTjG1vJj-Kh5dPZi0HZTuCB9ZLbNGpbRvkIW9E_hry0WXZQy9LtyFD7AT_sYTs-B0xR1bEILG5JOBe1dn3djJd19V4NbjxYTQxaGhY-iJxmkHucd32LDCoo-m0QDl-hBsMW73d9WXdQRoZ17Q_Fu5k-m8g5K47J-fwCBguyRw4irYnEC0hBxOOOV5xaKaXl0c/',
    rarity: 'Covert',
    weapon: 'AWP',
    exterior: 'Factory New',
    category: 'Sniper'
  },
  {
    id: 'shop-012',
    name: '★ Skeleton Knife | Crimson Web',
    price: 580.00,
    image: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UXnczMHWoN-shBRTjG1vJj-Kh5dPZi0HZTuCB9ZLbNGpbRvkIW9E_hry0WXZQy9LtyFD7AT_sYTs-B0xR1bEILG5JOBe1dn3djJd19V4NbjxYTQxaOtZ-2J2DkI7MQj0--YoN-k31Dk80FvYDr0doCQdwc_YFHT-QO_xOa6h5fp7Z-cziRmu3Yg/',
    rarity: 'Covert',
    weapon: 'Knife',
    exterior: 'Minimal Wear',
    category: 'Knife'
  },
  {
    id: 'shop-013',
    name: 'AK-47 | Wild Lotus',
    price: 2800.00,
    image: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UXnczMHWoN-shBRTjG1vJj-Kh5dPZi0HZTuCB9ZLbNGpbRvkIW9E_hry0WXZQy9LtyFD7AT_sYTs-B0xR1bEILG5JOBe1dn3djJd19V4NbjxYTQxaChMOyIxT0A6scu2rGToI2jiVCxqkM5NjqhJIOXewRvZV-D-FK_lejo2JK6uZiYznI1u3ci4izbnBK00RwaOLcI/',
    rarity: 'Covert',
    weapon: 'AK-47',
    exterior: 'Factory New',
    category: 'Rifle'
  },
  {
    id: 'shop-014',
    name: '★ Talon Knife | Doppler',
    price: 650.00,
    image: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UXnczMHWoN-shBRTjG1vJj-Kh5dPZi0HZTuCB9ZLbNGpbRvkIW9E_hry0WXZQy9LtyFD7AT_sYTs-B0xR1bEILG5JOBe1dn3djJd19V4NbjxYTQxaGlNrmIxT0BusMh0-uXpI7x2Qey_RI6YT_0JYeccFQ-MFnVqAO4wezp0JS_6MmYymJA5SslrC-MnBSx0kkdb-c9/',
    rarity: 'Covert',
    weapon: 'Knife',
    exterior: 'Factory New',
    category: 'Knife'
  },
  {
    id: 'shop-015',
    name: '★ Driver Gloves | King Snake',
    price: 520.00,
    image: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UXnczMHWoN-shBRTjG1vJj-Kh5dPZi0HZTuCB9ZLbNGpbRvkIW9E_hry0WXZQy9LtyFD7AT_sYTs-B0xR1bIR7W4OBef0Dl2-TzYzhF49OJl4y0mvnwYOOBxD1Xv8Eu2OrHpo72jFHm_kRoZGD1JIeVe1U-N17T-wbvl-rp08e4v5aYzSc37icz/',
    rarity: 'Extraordinary',
    weapon: 'Gloves',
    exterior: 'Field-Tested',
    category: 'Gloves'
  },
  {
    id: 'shop-016',
    name: 'Desert Eagle | Code Red',
    price: 52.00,
    image: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UXnczMHWoN-shBRTjG1vJj-Kh5dPZi0HZTuCB9ZLbNGpbRvkIW9E_hry0WXZQy9LtyFD7AT_sYTs-B0xR1bEILG5JOBe1dn3djJd19V4NbjxYTQxaCtZe2IxjlRvpR12-bF8IqiiQax_hY_MWimJoeXelBvYlvVqFO3l-a715O_7ZufyiVquHQn-yvYnRK1gx9Nb-E4/',
    rarity: 'Covert',
    weapon: 'Desert Eagle',
    exterior: 'Factory New',
    category: 'Pistol'
  },
  {
    id: 'shop-017',
    name: '★ Huntsman Knife | Gamma Doppler',
    price: 380.00,
    image: 'https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UXnczMHWoN-shBRTjG1vJj-Kh5dPZi0HZTuCB9ZLbNGpbRvkIW9E_hry0WXZQy9LtyFD7AT_sYTs-B0xR1bEILG5JOBe1dn3djJd19V4NbjxYTQxaOtZ-2J2DkI7MQj0--YoN-k31Dk80FvYDryIYeRd1c4Z1qC_Va9k-u5g568uskCasJk/',
    rarity: 'Covert',
    weapon: 'Knife',
    exterior: 'Factory New',
    category: 'Knife'
  }
];

// ============================================================
// Middleware Setup
// ============================================================

app.use(cors({
  origin: DOMAIN,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: false // Set to true in production with HTTPS
  }
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Passport serialization
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Configure Steam Strategy (only if API key is available)
if (!DEMO_MODE) {
  passport.use(new SteamStrategy({
    returnURL: `${DOMAIN}/auth/steam/callback`,
    realm: DOMAIN,
    apiKey: STEAM_API_KEY
  }, (identifier, profile, done) => {
    const user = {
      steamid: profile.id,
      personaname: profile.displayName,
      avatarfull: profile._json.avatarfull,
      profileurl: profile._json.profileurl
    };
    return done(null, user);
  }));
}

// Serve static files from /public
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// Auth Routes
// ============================================================

// GET /auth/steam - Initiate Steam Login
app.get('/auth/steam', (req, res, next) => {
  if (DEMO_MODE) {
    // Demo mode: create a fake user session
    const demoUser = {
      steamid: '76561198000000000',
      personaname: 'Demo Player',
      avatarfull: 'https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg',
      profileurl: 'https://steamcommunity.com/id/demoplayer/'
    };
    req.login(demoUser, (err) => {
      if (err) return next(err);
      return res.redirect('/');
    });
  } else {
    passport.authenticate('steam')(req, res, next);
  }
});

// GET /auth/steam/callback - Steam OAuth Callback
app.get('/auth/steam/callback',
  (req, res, next) => {
    if (DEMO_MODE) {
      return res.redirect('/');
    }
    passport.authenticate('steam', { failureRedirect: '/' })(req, res, next);
  },
  (req, res) => {
    res.redirect('/');
  }
);

// GET /auth/logout - Logout
app.get('/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    req.session.destroy(() => {
      res.redirect('/');
    });
  });
});

// ============================================================
// API Routes
// ============================================================

// GET /api/user - Get Current User Info
app.get('/api/user', (req, res) => {
  if (req.isAuthenticated()) {
    return res.json({
      authenticated: true,
      user: {
        steamid: req.user.steamid,
        personaname: req.user.personaname,
        avatarfull: req.user.avatarfull
      }
    });
  }
  return res.json({ authenticated: false, user: null });
});

// GET /api/inventory/:steamid - Get User Inventory (Mock)
app.get('/api/inventory/:steamid', (req, res) => {
  const { steamid } = req.params;

  if (!steamid || steamid.length < 5) {
    return res.status(400).json({
      success: false,
      error: 'Invalid Steam ID'
    });
  }

  // Return mock inventory with slight randomization of prices (±10%)
  const inventory = MOCK_INVENTORY.map(item => ({
    ...item,
    price: parseFloat((item.price * (0.9 + Math.random() * 0.2)).toFixed(2))
  }));

  // Shuffle the inventory for variety
  inventory.sort(() => Math.random() - 0.5);

  return res.json({
    success: true,
    steamid,
    items: inventory,
    totalItems: inventory.length
  });
});

// POST /api/upgrade - Perform Upgrade (Mock)
app.post('/api/upgrade', (req, res) => {
  const { inputItems, targetItem } = req.body;

  // Validate input
  if (!inputItems || !Array.isArray(inputItems) || inputItems.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No input items provided'
    });
  }

  if (!targetItem || !targetItem.price || !targetItem.name) {
    return res.status(400).json({
      success: false,
      error: 'No target item specified'
    });
  }

  // Calculate total input value
  const totalInputValue = inputItems.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
  const targetValue = parseFloat(targetItem.price) || 0;

  if (totalInputValue <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Input items have no value'
    });
  }

  if (targetValue <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Target item has no value'
    });
  }

  // Calculate success chance: (totalInputValue / targetValue) * 100
  let chance = (totalInputValue / targetValue) * 100;

  // Cap chance between 1% and 95%
  chance = Math.max(1, Math.min(95, chance));
  chance = parseFloat(chance.toFixed(2));

  // Determine win/loss
  const roll = Math.random() * 100;
  const won = roll < chance;

  // Build response
  const result = {
    success: true,
    upgrade: {
      inputItems: inputItems.map(i => ({ name: i.name, price: i.price })),
      targetItem: { name: targetItem.name, price: targetItem.price },
      totalInputValue: parseFloat(totalInputValue.toFixed(2)),
      targetValue: parseFloat(targetValue.toFixed(2)),
      chance,
      roll: parseFloat(roll.toFixed(2)),
      won,
      message: won
        ? `🎉 Congratulations! You won ${targetItem.name} worth $${targetValue.toFixed(2)}!`
        : `💀 Upgrade failed. You lost $${totalInputValue.toFixed(2)} worth of skins. Better luck next time!`
    }
  };

  // Add won item details if successful
  if (won) {
    result.upgrade.wonItem = {
      id: targetItem.id || 'won-' + Date.now(),
      name: targetItem.name,
      price: targetItem.price,
      image: targetItem.image,
      rarity: targetItem.rarity,
      weapon: targetItem.weapon,
      exterior: targetItem.exterior
    };
  }

  console.log(`[UPGRADE] ${won ? 'WIN' : 'LOSS'} | Input: $${totalInputValue.toFixed(2)} → Target: $${targetValue.toFixed(2)} | Chance: ${chance}% | Roll: ${roll.toFixed(2)}`);

  return res.json(result);
});

// GET /api/shop - Get Available Target Skins
app.get('/api/shop', (req, res) => {
  const { category, minPrice, maxPrice, sort } = req.query;

  let items = [...SHOP_ITEMS];

  // Filter by category
  if (category && category !== 'all') {
    items = items.filter(item =>
      item.category.toLowerCase() === category.toLowerCase()
    );
  }

  // Filter by price range
  if (minPrice) {
    items = items.filter(item => item.price >= parseFloat(minPrice));
  }
  if (maxPrice) {
    items = items.filter(item => item.price <= parseFloat(maxPrice));
  }

  // Sort
  if (sort === 'price_asc') {
    items.sort((a, b) => a.price - b.price);
  } else if (sort === 'price_desc') {
    items.sort((a, b) => b.price - a.price);
  } else if (sort === 'name') {
    items.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    // Default: sort by price descending
    items.sort((a, b) => b.price - a.price);
  }

  return res.json({
    success: true,
    items,
    totalItems: items.length,
    categories: [...new Set(SHOP_ITEMS.map(i => i.category))]
  });
});

// ============================================================
// Catch-all: Serve index.html for SPA routing
// ============================================================

app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head><title>CS2 Upgrader - Setup Required</title>
        <style>
          body { background: #0a0a0f; color: #e0e0e0; font-family: 'Segoe UI', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
          .container { text-align: center; max-width: 600px; padding: 40px; }
          h1 { color: #f39c12; font-size: 2rem; }
          p { color: #888; line-height: 1.6; }
          code { background: #1a1a2e; padding: 2px 8px; border-radius: 4px; color: #00d4ff; }
          .status { margin-top: 30px; padding: 20px; background: #111122; border-radius: 8px; border: 1px solid #222; }
          .status h3 { color: #00ff88; }
          a { color: #00d4ff; }
        </style>
        </head>
        <body>
          <div class="container">
            <h1>🔫 CS2 Skin Upgrader</h1>
            <p>The server is running, but no frontend files were found in <code>/public</code>.</p>
            <div class="status">
              <h3>✅ API Endpoints Active</h3>
              <p>
                <a href="/api/user">/api/user</a> - User info<br>
                <a href="/api/inventory/76561198000000000">/api/inventory/:steamid</a> - Inventory<br>
                <a href="/api/shop">/api/shop</a> - Shop items<br>
                <a href="/auth/steam">/auth/steam</a> - Steam login${DEMO_MODE ? ' (Demo Mode)' : ''}
              </p>
            </div>
          </div>
        </body>
        </html>
      `);
    }
  });
});

// ============================================================
// Error Handling
// ============================================================

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// ============================================================
// Start Server
// ============================================================

app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║       🔫 CS2 SKIN UPGRADER SERVER       ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║  URL:  ${DOMAIN.padEnd(32)}║`);
  console.log(`║  Port: ${String(PORT).padEnd(32)}║`);
  console.log(`║  Mode: ${(DEMO_MODE ? 'DEMO (no Steam key)' : 'PRODUCTION').padEnd(32)}║`);
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
});
